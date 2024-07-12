import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/gui";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  PointLight,
  Mesh,
  MeshBuilder,
  PointsCloudSystem,
  StandardMaterial,
  Color3,
  Color4,
  AxesViewer,
  Material,
} from "@babylonjs/core";
import {
  AdvancedDynamicTexture,
  StackPanel,
  Control,
  TextBlock,
  Slider,
  Checkbox,
  Button,
} from "@babylonjs/gui/2D";
import { gen_mindemo_3D_data } from "./mindemo.ts";
import { Synth } from "tone";

class DrawGraph {
  constructor() {
    //// canvas
    var canvas = document.createElement("canvas");
    canvas.style.width = "1280px"; // "100%";
    canvas.style.height = "720px"; // "100%";
    canvas.id = "canvas";
    document.body.appendChild(canvas);

    //// engin, scene
    var engine = new Engine(canvas, true);
    var scene = new Scene(engine);
    var background_brightness = 0.5;
    scene.clearColor = new Color4(
      background_brightness,
      background_brightness,
      background_brightness,
      1.0
    );

    //// camera
    var camera: ArcRotateCamera = new ArcRotateCamera(
      "Camera",
      Math.PI / 2,
      Math.PI / 2,
      2,
      Vector3.Zero(),
      scene
    );
    // camera.attachControl(canvas, true);
    camera.detachControl();
    camera.wheelPrecision = 50.0;
    var camera_pos_x = 1;
    var camera_pos_y = 3;
    var camera_pos_z = -5;
    camera.setPosition(new Vector3(camera_pos_x, camera_pos_y, camera_pos_z));
    var camera_radius = camera.radius;
    var camera_alpha = camera.alpha;
    var camera_beta = camera.beta;

    //// light
    var light_1: HemisphericLight = new HemisphericLight(
      "light_1",
      new Vector3(0, 1, 0),
      scene
    );
    var light_2: PointLight = new PointLight(
      "pointLight",
      new Vector3(0, 0, 0),
      scene
    );

    //// tone.js
    var synth_model_slider_motion: Synth = null;
    var synth_step_size_slider_motion: Synth = null;
    var synth_graph_slider_motion: Synth = null;
    var graph_slider_motion_sound_playing: boolean = false;
    var synth_button_click: Synth = null;
    var button_click_sound_playing: boolean = false;
    function playButtonClickSound () {
      if (synth_button_click == null) {
        synth_button_click = new Synth( {
          oscillator : {
            type : "triangle"
          }
          ,
          envelope : {
            attack : 0.001 ,
            decay : 0.05 ,
            sustain : 0.0 ,
            release : 0.08
          }
        }).toDestination();
      }
      if(!button_click_sound_playing){
        button_click_sound_playing = true;
        synth_button_click.triggerAttackRelease(440, "8n");
        setTimeout( () => {
          button_click_sound_playing = false;
        }, 100)
      }
    }
    var camera_action_sound_playing: boolean = false;
    var synth_camera_zoom: Synth = null;
    function playCameraZoomSound (freq: number) {
      if (synth_camera_zoom == null) {
        synth_camera_zoom = new Synth( 
          {
            oscillator : {
              type : "sawtooth2"
            }
            ,
            envelope : {
              attack : 0.005,
              decay : 0.05,
              sustain : 0.0,
              release : 0.1
            }
          }
        ).toDestination();
        synth_camera_zoom.volume.value = -8;
        synth_camera_zoom.portamento = 0.1;
      }
      if(!camera_action_sound_playing){
        camera_action_sound_playing = true;
        synth_camera_zoom.triggerAttack(freq);
        setTimeout( () => {
          camera_action_sound_playing = false;
          synth_camera_zoom.triggerRelease();
        }, 100)
      }
    }
    var synth_camera_rotation_1: Synth = null;
    var synth_camera_rotation_2: Synth = null;
    function playCameraRotationSound (freq: number) {
      if (synth_camera_rotation_1 == null) {
        synth_camera_rotation_1 = new Synth( 
          {
            oscillator : {
              type : "sine5"
            }
            ,
            envelope : {
              attack : 0.01,
              decay : 0.05,
              sustain : 0.1,
              release : 0.1
            }
          }
        ).toDestination();
        synth_camera_rotation_1.volume.value = -12;
        synth_camera_rotation_1.portamento = 0.2;
      }
      if (synth_camera_rotation_2 == null) {
        synth_camera_rotation_2 = new Synth( 
          {
            oscillator : {
              type : "sine1"
            }
            ,
            envelope : {
              attack : 0.1,
              decay : 0.1,
              sustain : 0.1,
              release : 0.2
            }
          }
        ).toDestination();
        synth_camera_rotation_2.volume.value = -16;
        synth_camera_rotation_2.portamento = 0.2;
      }
      if(!camera_action_sound_playing){
        camera_action_sound_playing = true;
        synth_camera_rotation_1.triggerAttack(0.8*freq);
        synth_camera_rotation_2.triggerAttack(1.2*freq);
        setTimeout( () => {
          camera_action_sound_playing = false;
          synth_camera_rotation_1.triggerRelease();
          synth_camera_rotation_2.triggerRelease();
        }, 200)
      }
    }
    var synth_camera_track_1: Synth = null;
    var synth_camera_track_2: Synth = null;
    function playCameraTrackSound (shift: number) {
      return new Promise( (resolve, reject) => {
        if (synth_camera_track_1 == null) {
          synth_camera_track_1 = new Synth( 
            {
              oscillator : {
                type : "sine2"
              }
              ,
              envelope : {
                attack : 0.1,
                decay : 0.5,
                sustain : 1.0,
                release : 1.0
              }
            }
          ).toDestination();
          synth_camera_track_1.volume.value = -16;
          synth_camera_track_1.portamento = 0.6;
        }
        if (synth_camera_track_2 == null) {
          synth_camera_track_2 = new Synth( 
            {
              oscillator : {
                type : "sine2"
              }
              ,
              envelope : {
                attack : 0.4,
                decay : 1.0,
                sustain : 1.0,
                release : 1.0
              }
            }
          ).toDestination();
          synth_camera_track_2.volume.value = -24;
          synth_camera_track_2.portamento = 0.6;
        }
        if(!camera_action_sound_playing){
          camera_action_sound_playing = true;
          synth_camera_track_1.triggerAttack(220 - Math.min(100, Math.max(-100, shift)));
          synth_camera_track_2.triggerAttack(440 - Math.min(100, Math.max(-100, shift)));
          setTimeout( () => {
            synth_camera_track_1.triggerAttack(220 - Math.min(200, Math.max(-200, 2*shift)));
            synth_camera_track_2.triggerAttack(440 - Math.min(200, Math.max(-200, 2*shift)));
          }, 600);
          setTimeout( () => {
            camera_action_sound_playing = false;
            synth_camera_track_1.triggerRelease();
            synth_camera_track_2.triggerRelease();
          }, 1200)
        }
      });
    }

    //// axes
    var global_axes = new AxesViewer(scene, 1.2);
    
    //// class
    class SliderParam {
      // ascending: boolean;
      header: TextBlock;
      slider: Slider;
      minimum: number;
      maximum: number;
      value: number;
      default: number;
      step: number;
      precision: number;
      key: string;
      label: string;
      uppercase: string;
      lowercase: string;
      tail: string;
      reset: boolean;

      constructor(
        minimum: number,
        maximum: number,
        value: number,
        step: number,
        precision: number,
        key: string,
        label: string,
        lowercase: string,
        uppercase: string
      ) {
        // this.ascending = true;
        this.minimum = minimum;
        this.maximum = maximum;
        this.value = value;
        this.default = value;
        this.step = step;
        this.precision = precision;
        this.key = key;
        this.label = label;
        this.lowercase = lowercase;
        this.uppercase = uppercase;
        this.tail = " [" + this.lowercase + "," + this.uppercase + "]";
        this.header = new TextBlock();
        this.header.text =
          this.label + String(this.value.toFixed(this.precision)) + this.tail;
        this.header.fontSize = 16;
        this.header.height = "25px";
        this.header.width = "180px";
        this.header.paddingTop = "5px";
        this.header.color = "black";
        this.slider = new Slider();
        this.slider.minimum = minimum;
        this.slider.maximum = maximum;
        this.slider.step = step;
        this.slider.value = value;
        this.slider.height = "30px";
        this.slider.width = "180px";
        this.slider.paddingBottom = "10px";
        this.reset = false;
      }

      increase() {
        if (this.value < this.maximum) {
          if (this.value + this.step >= this.maximum) {
            this.value = this.maximum;
          } else {
            this.value = this.value + this.step;
          }
        } else {
          this.value = this.maximum;
        }
        this.set_slider_value(this.value);
      }
      decrease() {
        if (this.value > this.minimum) {
          if (this.value - this.step <= this.minimum) {
            this.value = this.minimum;
          } else {
            this.value = this.value - this.step;
          }
        } else {
          this.value = this.minimum;
        }
        this.set_slider_value(this.value);
      }
      set_slider_value(value: number) {
        this.value = value;
        this.slider.value = value;
        this.header.text =
          this.label + String(this.value.toFixed(this.precision)) + this.tail;
      }

      playModelSliderMotionSound () {
        if (synth_model_slider_motion == null) {
          synth_model_slider_motion = synth_model_slider_motion = new Synth( {
            oscillator : {
              type : "sine"
            }
            ,
            envelope : {
              attack : 0.005,
              decay : 0.05,
              sustain : 0.0,
              release : 0.08
            }
          }).toDestination()
        }
        var kappa = Math.abs(this.slider.value - this.slider.minimum) / (Math.abs(this.slider.maximum - this.slider.minimum));
        var frequency = (kappa * 880 + (1 - kappa) * 110);
        synth_model_slider_motion.triggerAttackRelease(frequency.toString(), "8n");
      }
      playStepSizeSliderMotionSound () {
        if (synth_step_size_slider_motion == null) {
          synth_step_size_slider_motion = synth_step_size_slider_motion = new Synth( {
            oscillator : {
              type : "sine3"
            }
            ,
            envelope : {
              attack : 0.005,
              decay : 0.05,
              sustain : 0.0,
              release : 0.08
            }
          }).toDestination()
        }
        var kappa = Math.abs(this.slider.value - this.slider.minimum) / (Math.abs(this.slider.maximum - this.slider.minimum));
        var frequency = (kappa * 880 + (1 - kappa) * 110);
        synth_step_size_slider_motion.triggerAttackRelease(frequency.toString(), "8n");
      }
      playGraphSliderMotionSound () {
        if (synth_graph_slider_motion == null) {
          synth_graph_slider_motion = synth_graph_slider_motion = new Synth( {
            oscillator : {
              type : "triangle6"
            }
            ,
            envelope : {
              attack : 0.005,
              decay : 0.05,
              sustain : 0.0,
              release : 0.08
            }
          }).toDestination()
        }
        var kappa = Math.abs(this.slider.value - this.slider.minimum) / (Math.abs(this.slider.maximum - this.slider.minimum));
        var frequency = (kappa * 880 + (1 - kappa) * 110);
        if(!graph_slider_motion_sound_playing){
          graph_slider_motion_sound_playing = true;
          synth_graph_slider_motion.triggerAttackRelease(frequency.toString(), "8n");
          setTimeout( () => {
            graph_slider_motion_sound_playing = false;
          }, 10)
        }
      }

      set_mixing_ratio(value: number) {
        mindemo_3D_marginal_params_dict_x.mixing_ratio = value;
        mindemo_3D_marginal_params_dict_y.mixing_ratio = value;
        mindemo_3D_marginal_params_dict_z.mixing_ratio = value;
        mindemo_3D_marginal_params_dict_list = [
          mindemo_3D_marginal_params_dict_x,
          mindemo_3D_marginal_params_dict_y,
          mindemo_3D_marginal_params_dict_z,
        ];
        if (!this.reset) {
          draw_mindemo_3D_from_params();
        }
      }
      add_response_for_marginal_params() {
        this.slider.onValueChangedObservable.add((value: any) => {
          if (!this.reset) {
            this.playModelSliderMotionSound();
          }
          this.set_slider_value(value);
          this.set_mixing_ratio(marginal_density_uniformity.value);
        });
        document.addEventListener("keydown", (event) => {
          if (String(event.key) == this.lowercase) {
            this.decrease();
          } else if (String(event.key) == this.uppercase) {
            this.increase();
          }
        });
      }
      reset_marginal_params() {
        this.reset = true;
        this.value = this.default;
        this.slider.value = this.default;
      }

      set_mindemo_3D_params(key: string, value: number) {
        mindemo_3D_params_dict[key] = value;
        if (!this.reset) {
          draw_mindemo_3D_from_params();
        }
      }
      add_response_for_mindemo_3D_params() {
        this.slider.onValueChangedObservable.add((value: any) => {
          if (!this.reset) {
            this.playModelSliderMotionSound();
          }
          this.set_slider_value(value);
          this.set_mindemo_3D_params(this.key, this.value);
        });
        document.addEventListener("keydown", (event) => {
          if (String(event.key) == this.lowercase) {
            this.decrease();
          } else if (String(event.key) == this.uppercase) {
            this.increase();
          }
        });
      }
      reset_mindemo_3D_params() {
        this.reset = true;
        this.value = this.default;
        this.slider.value = this.default;
      }

      set_xyz_step_size(value: number) {
        mindemo_3D_step_size = value;
        draw_mindemo_3D_from_params();
      }
      add_response_for_xyz_step_size() {
        this.slider.onValueChangedObservable.add((value: any) => {
          if (!this.reset) {
            this.playStepSizeSliderMotionSound();
          }
          this.set_slider_value(value);
          this.set_xyz_step_size(this.value);
        });
        document.addEventListener("keydown", (event) => {
          if (String(event.key) == this.lowercase) {
            this.decrease();
          } else if (String(event.key) == this.uppercase) {
            this.increase();
          }
        });
      }

      add_response_for_shape() {
        this.slider.onValueChangedObservable.add((value: any) => {
          if (!this.reset) {
            this.playGraphSliderMotionSound();
          }
          this.set_slider_value(value);
          redraw_mindemo_3D();
        });
        document.addEventListener("keydown", (event) => {
          if (String(event.key) == this.lowercase) {
            this.decrease();
          } else if (String(event.key) == this.uppercase) {
            this.increase();
          }
        });
      }

      set_background(value: number) {
        background_brightness = value;
        scene.clearColor = new Color4(
          background_brightness,
          background_brightness,
          background_brightness,
          1.0
        );
      }
      add_response_for_background() {
        this.slider.onValueChangedObservable.add((value: any) => {
          if (!this.reset) {
            this.playGraphSliderMotionSound();
          }
          this.set_slider_value(value);
          this.set_background(this.value);
        });
        document.addEventListener("keydown", (event) => {
          if (String(event.key) == this.lowercase) {
            this.decrease();
          } else if (String(event.key) == this.uppercase) {
            this.increase();
          }
        });
      }

      set_material_params() {
        gen_materials(materials_num);
        if (shape.value == 0) {
          for (var i = 0; i < box_mesh_list.length; i++) {
            var k = Math.floor(materials_num * box_weight_list[i]);
            if (k >= materials_num) {
              k = materials_num - 1;
            }
          }
          redraw_mindemo_3D();
        } else {
          for (var i = 0; i < box_mesh_list.length; i++) {
            var k = Math.floor(materials_num * box_weight_list[i]);
            if (k >= materials_num) {
              k = materials_num - 1;
            }
            if (shape.value < 0) {
              box_mesh_list[i].material = box_mat_list[k];
              box_mesh_list[i].scaling.x = scaling.value;
              box_mesh_list[i].scaling.y = scaling.value;
              box_mesh_list[i].scaling.z = scaling.value;
            } else if (shape.value > 0) {
              box_mesh_list[i].material = box_mat_list[k];
              box_mesh_list[i].scaling.x = scaling.value * box_size_list[k];
              box_mesh_list[i].scaling.y = scaling.value * box_size_list[k];
              box_mesh_list[i].scaling.z = scaling.value * box_size_list[k];
            }
          }
        }
      }
      add_response_for_material_params() {
        this.slider.onValueChangedObservable.add((value: any) => {
          if (!this.reset) {
            this.playGraphSliderMotionSound();
          }
          this.set_slider_value(value);
          this.set_material_params();
        });
        document.addEventListener("keydown", (event) => {
          if (String(event.key) == this.lowercase) {
            this.decrease();
          } else if (String(event.key) == this.uppercase) {
            this.increase();
          }
        });
      }

      set_range_params() {
        if (shape.value == 0) {
          for (var i = 0; i < box_mesh_list.length; i++) {
            box_mesh_list[i].mesh = set_box_visibility(
              box_mesh_list[i].mesh,
              box_weight_list[i],
              normalized_density_lower_limit.value,
              normalized_density_upper_limit.value,
              x_lower_limit.value,
              x_upper_limit.value,
              y_lower_limit.value,
              y_upper_limit.value,
              z_lower_limit.value,
              z_upper_limit.value,
              r_lower_limit.value,
              r_upper_limit.value
            );
          }
        } else {
          for (var i = 0; i < box_mesh_list.length; i++) {
            box_mesh_list[i] = set_box_visibility(
              box_mesh_list[i],
              box_weight_list[i],
              normalized_density_lower_limit.value,
              normalized_density_upper_limit.value,
              x_lower_limit.value,
              x_upper_limit.value,
              y_lower_limit.value,
              y_upper_limit.value,
              z_lower_limit.value,
              z_upper_limit.value,
              r_lower_limit.value,
              r_upper_limit.value
            );
          }
        }
      }
      add_response_for_range_params() {
        this.slider.onValueChangedObservable.add((value: any) => {
          this.playGraphSliderMotionSound();
          this.set_slider_value(value);
          this.set_range_params();
        });
        document.addEventListener("keydown", (event) => {
          if (String(event.key) == this.lowercase) {
            this.decrease();
          } else if (String(event.key) == this.uppercase) {
            this.increase();
          }
        });
      }
    }

    //// mindemo parameters
    var mindemo_3D_step_size = 0.25;
    var mindemo_3D_marginal_params_dict_x: { key?: string } = {
      location: 0.0,
      scale: 1.0,
      mixing_ratio: 1.0,
      "@*1": 0,
      "@*x": 0.5,
      "@*xx": 0,
    };
    var mindemo_3D_marginal_params_dict_y: { key?: string } = {
      location: 0.0,
      scale: 1.0,
      mixing_ratio: 1.0,
      "@*1": 0,
      "@*x": 0.5,
      "@*xx": 0,
    };
    var mindemo_3D_marginal_params_dict_z: { key?: string } = {
      location: 0.0,
      scale: 1.0,
      mixing_ratio: 1.0,
      "@*1": 0,
      "@*x": 0.5,
      "@*xx": 0,
    };
    var mindemo_3D_marginal_density_types_list = [
      "UniNormMix",
      "UniNormMix",
      "UniNormMix",
    ];
    var mindemo_3D_marginal_params_dict_list = [
      mindemo_3D_marginal_params_dict_x,
      mindemo_3D_marginal_params_dict_y,
      mindemo_3D_marginal_params_dict_z,
    ];
    var mindemo_3D_params_dict: { key?: string } = {
      "@*xy": 0.0,
      "@*xz": 0.0,
      "@*yz": 0.0,
      "@*xxy": 0.0,
      "@*xxz": 0.0,
      "@*xyy": 0.0,
      "@*xyz": 0.0,
      "@*xzz": 0.0,
      "@*yyz": 0.0,
      "@*yzz": 0.0,
      "@*abs(x+y+z)": 0.0,
      "@*abs(xy+yz+zx)": 0.0,
      "@*abs(xyz)": 0.0,
      "@*sin(1+r)": 0.0,
      "sin(1+@*r)": 1.0,
      "sin(@*1+r)": 0.0,
      "custom": 0.0,
    };
    //// 3D parameters
    var box_mesh_list: Array<Mesh | PointsCloudSystem> = [];
    var box_weight_list: Array<number> = [];
    var box_mat_list: Array<Material> = [];
    var box_size_list: Array<number> = [];
    var mindemo_3D_data: Array<Array<number>> = [];
    //// slider parameters
    var density_param_slider_initial_value = 0.0;
    var density_param_slider_minimum = -200.0;
    var density_param_slider_maximum = 200.0;
    var density_param_slider_step_size = 0.01;
    var density_param_slider_precision = 2;
    var viz_slider_step_size = 0.01;
    var viz_slider_precision = 2;
    var materials_num = 100;
    var round_num = 8;
    //// sliders
    function* gen_char(txt: string) {
      var arr = txt.split("");
      var i = 0;
      while (true) {
        yield arr[i];
        i = (i + 1) % arr.length;
      }
    }
    var char_123 = gen_char("0123456789");
    var char_abc = gen_char("abcdefghijklmnopqrstuvwxyz");
    var char_ABC = gen_char("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    var char_axes_off = char_123.next().value;
    var char_axes_on = char_123.next().value;
    var background = new SliderParam(
      0.0,
      1.0,
      0.5,
      viz_slider_step_size,
      viz_slider_precision,
      "background",
      "background = ",
      char_123.next().value,
      char_123.next().value
    );
    background.header.fontSize = 14;
    background.add_response_for_background();
    background.slider.width = "160px";
    var hue = new SliderParam(
      0.0,
      1.0,
      0.0,
      viz_slider_step_size,
      viz_slider_precision,
      "hue",
      "color = ",
      char_123.next().value,
      char_123.next().value
    );
    hue.add_response_for_material_params();
    hue.slider.width = "160px";
    var opacity = new SliderParam(
      0.0,
      1.0,
      0.5,
      viz_slider_step_size,
      viz_slider_precision,
      "opacity",
      "opacity = ",
      char_123.next().value,
      char_123.next().value
    );
    opacity.add_response_for_material_params();
    opacity.slider.width = "160px";
    var lighting = new SliderParam(
      -1.0,
      2.0,
      1.0,
      viz_slider_step_size,
      viz_slider_precision,
      "lighting",
      "light = ",
      char_123.next().value,
      char_123.next().value
    );
    lighting.add_response_for_material_params();
    lighting.slider.width = "160px";
    var marginal_density_uniformity = new SliderParam(
      0.0,
      1.0,
      1.0,
      density_param_slider_step_size,
      density_param_slider_precision,
      "uniformity",
      "uniformity = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    marginal_density_uniformity.add_response_for_marginal_params();
    var density_param_xy = new SliderParam(
      density_param_slider_minimum,
      density_param_slider_maximum,
      density_param_slider_initial_value,
      density_param_slider_step_size,
      density_param_slider_precision,
      "@*xy",
      "xy = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    density_param_xy.add_response_for_mindemo_3D_params();
    var density_param_xz = new SliderParam(
      density_param_slider_minimum,
      density_param_slider_maximum,
      density_param_slider_initial_value,
      density_param_slider_step_size,
      density_param_slider_precision,
      "@*xz",
      "xz = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    density_param_xz.add_response_for_mindemo_3D_params();
    // var density_param_yz = new SliderParam(density_param_slider_minimum, density_param_slider_maximum,
    //     density_param_slider_initial_value,
    //     density_param_slider_step_size, density_param_slider_precision,
    //     "@*yz", "yz = ", char_abc.next().value, char_ABC.next().value);
    // density_param_yz.add_response_for_mindemo_3D_params ();
    var density_param_xxy = new SliderParam(
      density_param_slider_minimum,
      density_param_slider_maximum,
      density_param_slider_initial_value,
      density_param_slider_step_size,
      density_param_slider_precision,
      "@*xxy",
      "xxy = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    density_param_xxy.add_response_for_mindemo_3D_params();
    var density_param_xxz = new SliderParam(
      density_param_slider_minimum,
      density_param_slider_maximum,
      density_param_slider_initial_value,
      density_param_slider_step_size,
      density_param_slider_precision,
      "@*xxz",
      "xxz = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    density_param_xxz.add_response_for_mindemo_3D_params();
    // var density_param_xyy = new SliderParam(density_param_slider_minimum, density_param_slider_maximum,
    //     density_param_slider_initial_value,
    //     density_param_slider_step_size, density_param_slider_precision,
    //     "@*xyy", "xyy = ", char_abc.next().value, char_ABC.next().value);
    // density_param_xyy.add_response_for_mindemo_3D_params ();
    var density_param_xyz = new SliderParam(
      density_param_slider_minimum,
      density_param_slider_maximum,
      density_param_slider_initial_value,
      density_param_slider_step_size,
      density_param_slider_precision,
      "@*xyz",
      "xyz = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    density_param_xyz.add_response_for_mindemo_3D_params();
    // var density_param_xzz = new SliderParam(density_param_slider_minimum, density_param_slider_maximum,
    //     density_param_slider_initial_value,
    //     density_param_slider_step_size, density_param_slider_precision,
    //     "@*xzz", "xzz = ", char_abc.next().value, char_ABC.next().value);
    // density_param_xzz.add_response_for_mindemo_3D_params ();
    // var density_param_yyz = new SliderParam(density_param_slider_minimum, density_param_slider_maximum,
    //     density_param_slider_initial_value,
    //     density_param_slider_step_size, density_param_slider_precision,
    //     "@*yyz", "yyz = ", char_abc.next().value, char_ABC.next().value);
    // density_param_yyz.add_response_for_mindemo_3D_params ();
    // var density_param_yzz = new SliderParam(density_param_slider_minimum, density_param_slider_maximum,
    //     density_param_slider_initial_value,
    //     density_param_slider_step_size, density_param_slider_precision,
    //     "@*yzz", "yzz = ", char_abc.next().value, char_ABC.next().value);
    // density_param_yzz.add_response_for_mindemo_3D_params ();
    var density_param_abs_x_y_z = new SliderParam(
      density_param_slider_minimum,
      density_param_slider_maximum,
      density_param_slider_initial_value,
      density_param_slider_step_size,
      density_param_slider_precision,
      "@*abs(x+y+z)",
      "|x+y+z| = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    density_param_abs_x_y_z.add_response_for_mindemo_3D_params();
    var density_param_abs_xy_yz_zx = new SliderParam(
      density_param_slider_minimum,
      density_param_slider_maximum,
      density_param_slider_initial_value,
      density_param_slider_step_size,
      density_param_slider_precision,
      "@*abs(xy+yz+zx)",
      "|xy+yz+zx| = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    density_param_abs_xy_yz_zx.add_response_for_mindemo_3D_params();
    var density_param_abs_xyz = new SliderParam(
      density_param_slider_minimum,
      density_param_slider_maximum,
      density_param_slider_initial_value,
      density_param_slider_step_size,
      density_param_slider_precision,
      "@*abs(xyz)",
      "|xyz| = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    density_param_abs_xyz.add_response_for_mindemo_3D_params();
    var density_param_sin_amp = new SliderParam(
      density_param_slider_minimum,
      density_param_slider_maximum,
      density_param_slider_initial_value,
      density_param_slider_step_size,
      density_param_slider_precision,
      "@*sin(1+r)",
      "sin:amp = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    density_param_sin_amp.add_response_for_mindemo_3D_params();
    var density_param_sin_freq = new SliderParam(
      -5,
      5,
      1.0,
      density_param_slider_step_size,
      density_param_slider_precision,
      "sin(1+@*r)",
      "sin:freq = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    density_param_sin_freq.add_response_for_mindemo_3D_params();
    var density_param_sin_phase = new SliderParam(
      -5,
      5,
      density_param_slider_initial_value,
      density_param_slider_step_size,
      density_param_slider_precision,
      "sin(@*1+r)",
      "sin:phase = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    density_param_sin_phase.add_response_for_mindemo_3D_params();
    var xyz_step_size = new SliderParam(
      0.04,
      1.0,
      mindemo_3D_step_size,
      density_param_slider_step_size,
      density_param_slider_precision,
      "step size",
      "step size = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    xyz_step_size.add_response_for_xyz_step_size();
    var scaling = new SliderParam(
      0.0,
      1.0,
      0.2,
      viz_slider_step_size,
      viz_slider_precision,
      "scaling",
      "scale = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    scaling.add_response_for_material_params();
    var shape = new SliderParam(
      -30,
      30,
      1,
      1,
      0,
      "shape",
      "shape = ",
      char_abc.next().value,
      char_ABC.next().value
    );
    shape.add_response_for_shape();
    var normalized_density_lower_limit = new SliderParam(
      0.0,
      1.0,
      0.0,
      viz_slider_step_size,
      viz_slider_precision,
      "normalized_density_lower_limit",
      "density >= ",
      char_abc.next().value,
      char_ABC.next().value
    );
    normalized_density_lower_limit.add_response_for_range_params();
    var normalized_density_upper_limit = new SliderParam(
      0.0,
      1.0,
      1.0,
      viz_slider_step_size,
      viz_slider_precision,
      "normalized_density_upper_limit",
      "density <= ",
      char_abc.next().value,
      char_ABC.next().value
    );
    normalized_density_upper_limit.add_response_for_range_params();
    var x_lower_limit = new SliderParam(
      -1.0,
      1.0,
      -1.0,
      viz_slider_step_size,
      viz_slider_precision,
      "x_lower_limit",
      "x >= ",
      char_abc.next().value,
      char_ABC.next().value
    );
    x_lower_limit.add_response_for_range_params();
    var x_upper_limit = new SliderParam(
      -1.0,
      1.0,
      1.0,
      viz_slider_step_size,
      viz_slider_precision,
      "x_upper_limit",
      "x <= ",
      char_abc.next().value,
      char_ABC.next().value
    );
    x_upper_limit.add_response_for_range_params();
    var y_lower_limit = new SliderParam(
      -1.0,
      1.0,
      -1.0,
      viz_slider_step_size,
      viz_slider_precision,
      "y_lower_limit",
      "y >= ",
      char_abc.next().value,
      char_ABC.next().value
    );
    y_lower_limit.add_response_for_range_params();
    var y_upper_limit = new SliderParam(
      -1.0,
      1.0,
      1.0,
      viz_slider_step_size,
      viz_slider_precision,
      "y_upper_limit",
      "y <= ",
      char_abc.next().value,
      char_ABC.next().value
    );
    y_upper_limit.add_response_for_range_params();
    var z_lower_limit = new SliderParam(
      -1.0,
      1.0,
      -1.0,
      viz_slider_step_size,
      viz_slider_precision,
      "z_lower_limit",
      "z >= ",
      char_abc.next().value,
      char_ABC.next().value
    );
    z_lower_limit.add_response_for_range_params();
    var z_upper_limit = new SliderParam(
      -1.0,
      1.0,
      1.0,
      viz_slider_step_size,
      viz_slider_precision,
      "z_upper_limit",
      "z <= ",
      char_abc.next().value,
      char_ABC.next().value
    );
    z_upper_limit.add_response_for_range_params();
    var r_lower_limit = new SliderParam(
      0.0,
      2.0,
      0.0,
      viz_slider_step_size,
      viz_slider_precision,
      "r_lower_limit",
      "r >= ",
      char_abc.next().value,
      char_ABC.next().value
    );
    r_lower_limit.add_response_for_range_params();
    var r_upper_limit = new SliderParam(
      0.0,
      2.0,
      2.0,
      viz_slider_step_size,
      viz_slider_precision,
      "r_upper_limit",
      "r <= ",
      char_abc.next().value,
      char_ABC.next().value
    );
    r_upper_limit.add_response_for_range_params();

    //// functions
    function gen_color_pattern(hue: number, lambda: number): Color3 {
      var col_1 =
        0.25 + 0.5 * (1 - lambda) + 0.25 * ((1 + lambda) * (1 - lambda));
      var col_2 =
        0.25 +
        0.5 * Math.min(2 * lambda, 2 - 2 * lambda) +
        0.25 * ((0.5 + lambda) * (1.5 - lambda));
      var col_3 = 0.25 + 0.5 * lambda + 0.25 * (lambda * (2 - lambda));
      var col: Color3 = new Color3(1, 1, 1);
      if (hue < 0.1) {
        col = new Color3(
          10 * (0.1 - hue) * col_3 + 10 * hue * col_3,
          10 * (0.1 - hue) * col_2 + 10 * hue * col_2,
          10 * (0.1 - hue) * col_1 + 10 * hue * col_2
        );
      } else if (hue < 0.2) {
        col = new Color3(
          10 * (0.2 - hue) * col_3 + 10 * (hue - 0.1) * col_1,
          10 * (0.2 - hue) * col_2 + 10 * (hue - 0.1) * col_3,
          10 * (0.2 - hue) * col_2 + 10 * (hue - 0.1) * col_2
        );
      } else if (hue < 0.3) {
        col = new Color3(
          10 * (0.3 - hue) * col_1 + 10 * (hue - 0.2) * col_2,
          10 * (0.3 - hue) * col_3 + 10 * (hue - 0.2) * col_3,
          10 * (0.3 - hue) * col_2 + 10 * (hue - 0.2) * col_3
        );
      } else if (hue < 0.4) {
        col = new Color3(
          10 * (0.4 - hue) * col_2 + 10 * (hue - 0.3) * col_2,
          10 * (0.4 - hue) * col_3 + 10 * (hue - 0.3) * col_1,
          10 * (0.4 - hue) * col_3 + 10 * (hue - 0.3) * col_3
        );
      } else if (hue < 0.5) {
        col = new Color3(
          10 * (0.5 - hue) * col_2 + 10 * (hue - 0.4) * col_1,
          10 * (0.5 - hue) * col_1 + 10 * (hue - 0.4) * col_2,
          10 * (0.5 - hue) * col_3 + 2 * (hue - 0.4) * col_2
        );
      } else if (hue < 0.6) {
        col = new Color3(
          10 * (0.6 - hue) * col_1 + 2 * (hue - 0.5) * col_1,
          10 * (0.6 - hue) * col_2 + 10 * (hue - 0.5) * col_1,
          2 * (0.6 - hue) * col_2 + 10 * (hue - 0.5) * col_2
        );
      } else if (hue < 0.7) {
        col = new Color3(
          2 * (0.7 - hue) * col_1 + 10 * (hue - 0.6) * col_3,
          10 * (0.7 - hue) * col_1 + 2 * (hue - 0.6) * col_1,
          10 * (0.7 - hue) * col_2 + 10 * (hue - 0.6) * col_2
        );
      } else if (hue < 0.8) {
        col = new Color3(
          10 * (0.8 - hue) * col_3 + 10 * (hue - 0.7) * col_3,
          2 * (0.8 - hue) * col_1 + 10 * (hue - 0.7) * col_3,
          10 * (0.8 - hue) * col_2 + 2 * (hue - 0.7) * col_1
        );
      } else if (hue < 0.9) {
        col = new Color3(
          10 * (0.9 - hue) * col_3 + 10 * (hue - 0.8) * col_3,
          10 * (0.9 - hue) * col_3 + 10 * (hue - 0.8) * col_3,
          2 * (0.9 - hue) * col_1 + 10 * (hue - 0.8) * col_3
        );
      } else {
        col = new Color3(
          10 * (1 - hue) * col_3 + 10 * (hue - 0.9) * col_1,
          10 * (1 - hue) * col_3 + 10 * (hue - 0.9) * col_1,
          10 * (1 - hue) * col_3 + 10 * (hue - 0.9) * col_1
        );
      }
      return col;
    }

    function gen_materials(materials_num: number) {
      if (box_mat_list.length > 0) {
        box_mat_list.forEach((mat) => {
          mat.dispose();
        });
      }
      box_mat_list = [];
      box_size_list = [];
      for (var i = 0; i < materials_num; i++) {
        var mat = new StandardMaterial("mat_" + String(i), scene);
        var lambda = (i + 1) * (1 / materials_num);
        var color = gen_color_pattern(hue.value, lambda);
        if (lighting.value <= -0.5) {
          light_1.intensity = 0;
          light_2.intensity = 0;
          var eColor_r =
            2 + 2 * lighting.value + (-2 * lighting.value - 1) * color.r;
          var eColor_g =
            2 + 2 * lighting.value + (-2 * lighting.value - 1) * color.g;
          var eColor_b =
            2 + 2 * lighting.value + (-2 * lighting.value - 1) * color.b;
          mat.emissiveColor = new Color3(eColor_r, eColor_g, eColor_b);
        } else if (lighting.value <= 0) {
          light_1.intensity = 0;
          light_2.intensity = 0;
          var eColor_r = -2 * lighting.value;
          var eColor_g = -2 * lighting.value;
          var eColor_b = -2 * lighting.value;
          mat.emissiveColor = new Color3(eColor_r, eColor_g, eColor_b);
        } else if (lighting.value <= 0.5) {
          light_1.intensity = 0;
          light_2.intensity = 8 * lighting.value;
          mat.diffuseColor = new Color3(
            lighting.value * color.r,
            lighting.value * color.g,
            lighting.value * color.b
          );
        } else if (lighting.value <= 1) {
          light_1.intensity = 4 * lighting.value - 2;
          light_2.intensity = 8 - 8 * lighting.value;
          mat.diffuseColor = color;
        } else {
          var direction_x = 3.3 * (1 - lighting.value) * (lighting.value - 1.5);
          var direction_y =
            1 - 2.3 * (1 - lighting.value) * (lighting.value - 1.5);
          var direction_z = 2.7 * (1 - lighting.value) * (lighting.value - 1.5);
          light_1.intensity = 2;
          light_1.direction = new Vector3(
            direction_x,
            direction_y,
            direction_z
          );
          light_2.intensity = 0;
          mat.diffuseColor = color;
        }
        if (opacity.value < 0.5) {
          mat.alpha = 2 * opacity.value * lambda;
        } else {
          mat.alpha =
            2 * (1 - opacity.value) * lambda + 2 * (opacity.value - 0.5);
        }
        box_mat_list.push(mat);
        box_size_list.push(lambda);
      }
    }

    function create_mindemo_3D_data_table(
      mindemo_3D_data_array: Array<Array<number>>
    ) {
      var mindemo_3D_data_table = document.createElement("table");
      mindemo_3D_data_table.style.width = "100%";
      mindemo_3D_data_table.style.height = "100%";
      mindemo_3D_data_table.id = "mindemo_3D_data";
      document.body.appendChild(mindemo_3D_data_table);
      //// header
      var tr_header = document.createElement("tr");
      tr_header.style.backgroundColor = "#75747a";
      mindemo_3D_data_table.appendChild(tr_header);
      let td_id = document.createElement("td");
      td_id.innerText = "id";
      td_id.style.fontSize = "80%";
      td_id.style.color = "#555555";
      tr_header.appendChild(td_id);
      let td_x = document.createElement("td");
      td_x.innerText = "x";
      td_x.style.fontSize = "80%";
      td_x.style.color = "#880000";
      tr_header.appendChild(td_x);
      let td_y = document.createElement("td");
      td_y.innerText = "y";
      td_y.style.fontSize = "80%";
      td_y.style.color = "#008800";
      tr_header.appendChild(td_y);
      let td_z = document.createElement("td");
      td_z.innerText = "z";
      td_z.style.fontSize = "80%";
      td_z.style.color = "#000088";
      tr_header.appendChild(td_z);
      let td_cost = document.createElement("td");
      td_cost.innerText = "cost";
      td_cost.style.fontSize = "80%";
      td_cost.style.color = "#880088";
      tr_header.appendChild(td_cost);
      let td_density = document.createElement("td");
      td_density.innerText = "density";
      td_density.style.fontSize = "80%";
      td_density.style.color = "#008888";
      tr_header.appendChild(td_density);
      //// data
      mindemo_3D_data_array.forEach((elements) => {
        var tr = document.createElement("tr");
        mindemo_3D_data_table.appendChild(tr);
        tr.style.backgroundColor = "#95949a";
        let td_id = document.createElement("td");
        td_id.innerText = String(elements[0]);
        td_id.style.fontSize = "80%";
        td_id.style.color = "#555555";
        tr.appendChild(td_id);
        let td_x = document.createElement("td");
        td_x.innerText = String(elements[1]);
        td_x.style.fontSize = "80%";
        td_x.style.color = "#880000";
        tr.appendChild(td_x);
        let td_y = document.createElement("td");
        td_y.innerText = String(elements[2]);
        td_y.style.fontSize = "80%";
        td_y.style.color = "#008800";
        tr.appendChild(td_y);
        let td_z = document.createElement("td");
        td_z.innerText = String(elements[3]);
        td_z.style.fontSize = "80%";
        td_z.style.color = "#000088";
        tr.appendChild(td_z);
        let td_cost = document.createElement("td");
        td_cost.innerText = String(elements[4]);
        td_cost.style.fontSize = "80%";
        td_cost.style.color = "#880088";
        tr.appendChild(td_cost);
        let td_density = document.createElement("td");
        td_density.innerText = String(elements[5]);
        td_density.style.fontSize = "80%";
        td_density.style.color = "#008888";
        tr.appendChild(td_density);
      });
    }

    function set_box_visibility(
      box: Mesh,
      box_weight: number,
      normalized_density_lower_limit: number,
      normalized_density_upper_limit: number,
      x_lower_limit: number,
      x_upper_limit: number,
      y_lower_limit: number,
      y_upper_limit: number,
      z_lower_limit: number,
      z_upper_limit: number,
      r_lower_limit: number,
      r_upper_limit: number
    ): Mesh {
      var r = Math.sqrt(
        box.position.x * box.position.x +
          box.position.y * box.position.y +
          box.position.z * box.position.z
      );
      var flag =
        box_weight >= normalized_density_lower_limit &&
        box_weight <= normalized_density_upper_limit &&
        box.position.x >= x_lower_limit &&
        box.position.x <= x_upper_limit &&
        box.position.y >= y_lower_limit &&
        box.position.y <= y_upper_limit &&
        box.position.z >= z_lower_limit &&
        box.position.z <= z_upper_limit &&
        r >= r_lower_limit &&
        r <= r_upper_limit;
      if (flag) {
        box.isVisible = true;
      } else {
        box.isVisible = false;
      }
      return box;
    }

    function gen_points_cloud_box(
      id: number | string,
      x: number,
      y: number,
      z: number,
      k: number,
      col: number,
      step_size: number,
      scaling_value: number,
      scene: Scene
    ): PointsCloudSystem {
      var box = new PointsCloudSystem(
        "Box" + id.toString(),
        Math.max(1, Math.min(0.04 * k, 4)),
        scene
      );
      box.addPoints(Math.floor(2 * k * step_size), (particle) => {
        particle.position = new Vector3(
          2 * scaling_value * (Math.random() - 0.5),
          2 * scaling_value * (Math.random() - 0.5),
          2 * scaling_value * (Math.random() - 0.5)
        );
        if (col < 0.1) {
          particle.color = new Color3(
            10 * (0.1 - col),
            10 * (0.1 - col),
            10 * (0.1 - col)
          );
        } else if (col < 0.2) {
          particle.color = new Color3(
            10 * (col - 0.1),
            -100 * (col - 0.1) * (col - 0.2),
            -400 * (col - 0.1) * (col - 0.2)
          );
        } else if (col < 0.3) {
          particle.color = new Color3(10 * (0.3 - col), 10 * (col - 0.2), 0);
        } else if (col < 0.4) {
          particle.color = new Color3(0, 10 * (0.4 - col), 10 * (col - 0.3));
        } else if (col < 0.5) {
          particle.color = new Color3(
            -400 * (col - 0.4) * (col - 0.5),
            5 * (col - 0.4),
            10 * (0.5 - col)
          );
        } else if (col < 0.6) {
          particle.color = new Color3(
            10 * (col - 0.5),
            5 * (col - 0.4),
            -400 * (col - 0.5) * (col - 0.6)
          );
        } else if (col < 0.7) {
          var mrand = Math.random();
          var lambda = 10 * (0.7 - col);
          particle.color = new Color3(
            lambda + (1 - lambda) * mrand,
            lambda + (1 - lambda) * mrand,
            (1 - lambda) * mrand
          );
        } else if (col < 0.75) {
          var mrand = Math.random();
          particle.color = new Color3(mrand, mrand, mrand);
        } else if (col < 0.8) {
          var mrand = Math.random();
          var lambda = 20 * (0.8 - col);
          particle.color = new Color3(
            lambda * mrand + (1 - lambda),
            mrand,
            mrand
          );
        } else if (col < 0.85) {
          var mrand = Math.random();
          var lambda = 20 * (0.85 - col);
          particle.color = new Color3(lambda, mrand, mrand);
        } else if (col < 0.9) {
          var mrand = Math.random();
          var lambda = 20 * (0.9 - col);
          particle.color = new Color3(mrand, lambda, mrand);
        } else if (col < 0.95) {
          var mrand = Math.random();
          var lambda = 20 * (0.95 - col);
          particle.color = new Color3(mrand, mrand, lambda);
        } else {
          particle.color = new Color3(
            Math.random(),
            Math.random(),
            Math.random()
          );
        }
      });
      box.buildMeshAsync().then((mesh) => {
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.position.z = z;
        mesh.scaling.x = 2 * scaling_value;
        mesh.scaling.y = 2 * scaling_value;
        mesh.scaling.z = 2 * scaling_value;
      });
      return box;
    }

    function gen_box(
      id: number | string,
      x: number,
      y: number,
      z: number,
      k: number,
      box_weight: number,
      shape_value: number,
      col: number,
      step_size: number,
      scaling_value: number,
      scene: Scene
    ): Mesh | PointsCloudSystem {
      var box: Mesh | PointsCloudSystem;
      switch (Math.abs(shape_value)) {
        case 0:
          box = gen_points_cloud_box(
            id,
            x,
            y,
            z,
            k,
            col,
            step_size,
            scaling_value,
            scene
          );
          break;
        case 1:
          box = MeshBuilder.CreateBox(
            "Box" + id.toString(),
            { height: 1, width: 1, depth: 1 },
            scene
          );
          break;
        case 2:
          box = MeshBuilder.CreateBox(
            "Box" + id.toString(),
            { height: 1, width: 1, depth: 1 },
            scene
          );
          box.rotation.x = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.y = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.z = 2 * (Math.random() - 0.5) * Math.PI;
          break;
        case 3:
          box = MeshBuilder.CreateCylinder(
            "Box" + id.toString(),
            { height: 1, tessellation: 16, diameter: 1, diameterTop: 1 },
            scene
          );
          break;
        case 4:
          box = MeshBuilder.CreateCylinder(
            "Box" + id.toString(),
            { height: 1, tessellation: 16, diameter: 1, diameterTop: 1 },
            scene
          );
          box.rotation.z = Math.PI / 2;
          break;
        case 5:
          box = MeshBuilder.CreateCylinder(
            "Box" + id.toString(),
            { height: 1, tessellation: 16, diameter: 1, diameterTop: 1 },
            scene
          );
          box.rotation.x = Math.PI / 2;
          break;
        case 6:
          box = MeshBuilder.CreateCylinder(
            "Box" + id.toString(),
            { height: 1, tessellation: 16, diameter: 1, diameterTop: 1 },
            scene
          );
          box.rotation.x = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.y = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.z = 2 * (Math.random() - 0.5) * Math.PI;
          break;
        case 7:
          box = MeshBuilder.CreateCylinder(
            "Box" + id.toString(),
            { height: 1, tessellation: 3, diameter: 1, diameterTop: 0 },
            scene
          );
          break;
        case 8:
          box = MeshBuilder.CreateCylinder(
            "Box" + id.toString(),
            { height: 1, tessellation: 3, diameter: 1, diameterTop: 0 },
            scene
          );
          box.rotation.x = Math.PI;
          break;
        case 9:
          box = MeshBuilder.CreateCylinder(
            "Box" + id.toString(),
            { height: 1, tessellation: 3, diameter: 1, diameterTop: 0 },
            scene
          );
          box.rotation.z = Math.PI / 2;
          break;
        case 10:
          box = MeshBuilder.CreateCylinder(
            "Box" + id.toString(),
            { height: 1, tessellation: 3, diameter: 1, diameterTop: 0 },
            scene
          );
          box.rotation.z = -Math.PI / 2;
          break;
        case 11:
          box = MeshBuilder.CreateCylinder(
            "Box" + id.toString(),
            { height: 1, tessellation: 3, diameter: 1, diameterTop: 0 },
            scene
          );
          box.rotation.x = Math.PI / 2;
          break;
        case 12:
          box = MeshBuilder.CreateCylinder(
            "Box" + id.toString(),
            { height: 1, tessellation: 3, diameter: 1, diameterTop: 0 },
            scene
          );
          box.rotation.x = -Math.PI / 2;
          break;
        case 13:
          box = MeshBuilder.CreateCylinder(
            "Box" + id.toString(),
            { height: 1, tessellation: 3, diameter: 1, diameterTop: 0 },
            scene
          );
          box.rotation.x = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.y = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.z = 2 * (Math.random() - 0.5) * Math.PI;
          break;
        case 14:
          box = MeshBuilder.CreateSphere(
            "Box" + id.toString(),
            { segments: 0.5, diameter: 1 },
            scene
          );
          break;
        case 15:
          box = MeshBuilder.CreateSphere(
            "Box" + id.toString(),
            { segments: 0.5, diameter: 1 },
            scene
          );
          box.rotation.x = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.y = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.z = 2 * (Math.random() - 0.5) * Math.PI;
          break;
        case 16:
          box = MeshBuilder.CreateSphere(
            "Box" + id.toString(),
            { segments: 1, diameter: 1 },
            scene
          );
          break;
        case 17:
          box = MeshBuilder.CreateSphere(
            "Box" + id.toString(),
            { segments: 1, diameter: 1 },
            scene
          );
          box.rotation.x = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.y = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.z = 2 * (Math.random() - 0.5) * Math.PI;
          break;
        case 18:
          box = MeshBuilder.CreateSphere(
            "Box" + id.toString(),
            { segments: 2, diameter: 1 },
            scene
          );
          break;
        case 19:
          box = MeshBuilder.CreateSphere(
            "Box" + id.toString(),
            { segments: 2, diameter: 1 },
            scene
          );
          box.rotation.x = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.y = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.z = 2 * (Math.random() - 0.5) * Math.PI;
          break;
        case 20:
          box = MeshBuilder.CreateSphere(
            "Box" + id.toString(),
            { segments: 16, diameter: 1 },
            scene
          );
          break;
        case 21:
          box = MeshBuilder.CreateCapsule(
            "Box" + id.toString(),
            { tessellation: 16, height: 1, radius: 0.3 },
            scene
          );
          break;
        case 22:
          box = MeshBuilder.CreateCapsule(
            "Box" + id.toString(),
            { tessellation: 16, height: 1, radius: 0.3 },
            scene
          );
          box.rotation.z = Math.PI / 2;
          break;
        case 23:
          box = MeshBuilder.CreateCapsule(
            "Box" + id.toString(),
            { tessellation: 16, height: 1, radius: 0.3 },
            scene
          );
          box.rotation.x = Math.PI / 2;
          break;
        case 24:
          box = MeshBuilder.CreateCapsule(
            "Box" + id.toString(),
            { tessellation: 16, height: 1, radius: 0.3 },
            scene
          );
          box.rotation.x = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.y = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.z = 2 * (Math.random() - 0.5) * Math.PI;
          break;
        case 25:
          box = MeshBuilder.CreateTorus(
            "Box" + id.toString(),
            { tessellation: 16, thickness: 0.3, diameter: 0.5 },
            scene
          );
          break;
        case 26:
          box = MeshBuilder.CreateTorus(
            "Box" + id.toString(),
            { tessellation: 16, thickness: 0.3, diameter: 0.5 },
            scene
          );
          box.rotation.z = Math.PI / 2;
          break;
        case 27:
          box = MeshBuilder.CreateTorus(
            "Box" + id.toString(),
            { tessellation: 16, thickness: 0.3, diameter: 0.5 },
            scene
          );
          box.rotation.x = Math.PI / 2;
          break;
        case 28:
          box = MeshBuilder.CreateTorus(
            "Box" + id.toString(),
            { tessellation: 16, thickness: 0.3, diameter: 0.5 },
            scene
          );
          box.rotation.x = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.y = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.z = 2 * (Math.random() - 0.5) * Math.PI;
          break;
        case 29:
          if (box_weight < 0.2) {
            box = MeshBuilder.CreateCylinder(
              "Box" + id.toString(),
              { height: 0.75, tessellation: 3, diameter: 0.75, diameterTop: 0 },
              scene
            );
          } else if (box_weight < 0.4) {
            box = MeshBuilder.CreateSphere(
              "Box" + id.toString(),
              { segments: 0.5, diameter: 1 },
              scene
            );
          } else if (box_weight < 0.6) {
            box = MeshBuilder.CreateSphere(
              "Box" + id.toString(),
              { segments: 16, diameter: 1 },
              scene
            );
          } else if (box_weight < 0.8) {
            box = MeshBuilder.CreateCylinder(
              "Box" + id.toString(),
              { height: 1, tessellation: 16, diameter: 1, diameterTop: 1 },
              scene
            );
          } else {
            box = MeshBuilder.CreateBox(
              "Box" + id.toString(),
              { height: 1, width: 1, depth: 1 },
              scene
            );
          }
          break;
        case 30:
          var mrand = Math.random();
          if (mrand < 0.1) {
            box = MeshBuilder.CreateBox(
              "Box" + id.toString(),
              { height: 1, width: 1, depth: 1 },
              scene
            );
          } else if (mrand < 0.2) {
            box = MeshBuilder.CreateCylinder(
              "Box" + id.toString(),
              { height: 1, tessellation: 3, diameter: 1, diameterTop: 0 },
              scene
            );
          } else if (mrand < 0.3) {
            box = MeshBuilder.CreateCylinder(
              "Box" + id.toString(),
              { height: 1, tessellation: 6, diameter: 1, diameterTop: 1 },
              scene
            );
          } else if (mrand < 0.4) {
            box = MeshBuilder.CreateCylinder(
              "Box" + id.toString(),
              { height: 1, tessellation: 16, diameter: 1, diameterTop: 1 },
              scene
            );
          } else if (mrand < 0.5) {
            box = MeshBuilder.CreateSphere(
              "Box" + id.toString(),
              { segments: 0.5, diameter: 1 },
              scene
            );
          } else if (mrand < 0.6) {
            box = MeshBuilder.CreateSphere(
              "Box" + id.toString(),
              { segments: 1, diameter: 1 },
              scene
            );
          } else if (mrand < 0.7) {
            box = MeshBuilder.CreateSphere(
              "Box" + id.toString(),
              { segments: 16, diameter: 1 },
              scene
            );
          } else if (mrand < 0.8) {
            box = MeshBuilder.CreateCapsule(
              "Box" + id.toString(),
              { tessellation: 16, height: 1, radius: 0.3 },
              scene
            );
          } else if (mrand < 0.9) {
            box = MeshBuilder.CreateTorus(
              "Box" + id.toString(),
              { tessellation: 4, thickness: 0.5, diameter: 0.8 },
              scene
            );
          } else {
            box = MeshBuilder.CreateTorus(
              "Box" + id.toString(),
              { tessellation: 16, thickness: 0.5, diameter: 0.8 },
              scene
            );
          }
          box.rotation.x = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.y = 2 * (Math.random() - 0.5) * Math.PI;
          box.rotation.z = 2 * (Math.random() - 0.5) * Math.PI;
          break;
        default:
          box = MeshBuilder.CreateBox(
            "Box" + id.toString(),
            { height: 1, width: 1, depth: 1 },
            scene
          );
          break;
      }
      return box;
    }

    function draw_mindemo_3D_from_params() {
      var N_size: Array<number>;
      var N_rank: number;
      var N_accum: Array<number>;
      var N_size_prod: number;
      var marginal_densities_ndarray_list: Array<Array<number>>;
      Promise.resolve()
        .then(() => {
          return new Promise((resolve) => {
            gen_materials(materials_num);
            if (box_mesh_list.length > 0) {
              box_mesh_list.forEach((mesh) => {
                mesh.dispose();
                if (shape.value == 0) {
                  mesh = null;
                }
              });
              box_mesh_list = [];
            }
            box_weight_list = [];
            [
              N_size,
              N_rank,
              N_accum,
              N_size_prod,
              marginal_densities_ndarray_list,
              mindemo_3D_data,
            ] = gen_mindemo_3D_data(
              mindemo_3D_marginal_density_types_list,
              mindemo_3D_marginal_params_dict_list,
              mindemo_3D_params_dict,
              mindemo_3D_step_size
            );
            resolve(true);
          });
        })
        .then(() => {
          return new Promise((resolve) => {
            var flag_header = false;
            var d_max = 0;
            mindemo_3D_data.forEach((elements) => {
              if (flag_header) {
                flag_header = false;
              } else {
                var d = Number(elements[5]); //// density
                if (d > d_max) {
                  d_max = d;
                }
              }
            });
            flag_header = false;
            mindemo_3D_data.forEach((elements) => {
              if (flag_header) {
                flag_header = false;
              } else {
                //// elements[0]; //// id
                var x = Number(elements[1]); //// x
                x =
                  Math.round(Math.pow(10, round_num) * x) /
                  Math.pow(10, round_num);
                var y = Number(elements[2]); //// y
                y =
                  Math.round(Math.pow(10, round_num) * y) /
                  Math.pow(10, round_num);
                var z = Number(elements[3]); //// z
                z =
                  Math.round(Math.pow(10, round_num) * z) /
                  Math.pow(10, round_num);
                //// elements[4]; //// cost
                var d = Number(elements[5]); //// density
                var box_weight = Math.cbrt(d / d_max);
                var k = Math.floor(materials_num * box_weight);
                if (k >= materials_num) {
                  k = materials_num - 1;
                }
                if (box_size_list[k] > 0) {
                  var d_len: number;
                  var box: Mesh | PointsCloudSystem;
                  if (shape.value <= 0) {
                    d_len = scaling.value;
                  } else {
                    d_len = scaling.value * box_size_list[k];
                  }
                  var box = gen_box(
                    elements[0],
                    x,
                    y,
                    z,
                    k,
                    box_weight,
                    shape.value,
                    hue.value,
                    mindemo_3D_step_size,
                    scaling.value,
                    scene
                  );
                  if (shape.value != 0) {
                    box.scaling.x = d_len;
                    box.scaling.y = d_len;
                    box.scaling.z = d_len;
                    box.material = box_mat_list[k];
                    box.position = new Vector3(x, y, z);
                    box.isVisible = true;
                  }
                  box_mesh_list.push(box);
                  box_weight_list.push(box_weight);
                }
              }
            });
            resolve(true);
          });
        })
        .then(() => {
          if (shape.value == 0) {
            for (var i = 0; i < box_mesh_list.length; i++) {
              box_mesh_list[i].mesh = set_box_visibility(
                box_mesh_list[i].mesh,
                box_weight_list[i],
                normalized_density_lower_limit.value,
                normalized_density_upper_limit.value,
                x_lower_limit.value,
                x_upper_limit.value,
                y_lower_limit.value,
                y_upper_limit.value,
                z_lower_limit.value,
                z_upper_limit.value,
                r_lower_limit.value,
                r_upper_limit.value
              );
            }
          } else {
            for (var i = 0; i < box_mesh_list.length; i++) {
              box_mesh_list[i] = set_box_visibility(
                box_mesh_list[i],
                box_weight_list[i],
                normalized_density_lower_limit.value,
                normalized_density_upper_limit.value,
                x_lower_limit.value,
                x_upper_limit.value,
                y_lower_limit.value,
                y_upper_limit.value,
                z_lower_limit.value,
                z_upper_limit.value,
                r_lower_limit.value,
                r_upper_limit.value
              );
            }
          }
          // create_mindemo_3D_data_table(mindemo_3D_data);
        });
    }
    draw_mindemo_3D_from_params();

    function redraw_mindemo_3D() {
      Promise.resolve()
        .then(() => {
          return new Promise((resolve) => {
            gen_materials(materials_num);
            if (box_mesh_list.length > 0) {
              box_mesh_list.forEach((mesh) => {
                mesh.dispose();
                if (shape.value == 0) {
                  mesh = null;
                }
              });
              box_mesh_list = [];
            }
            box_weight_list = [];
            resolve(true);
          });
        })
        .then(() => {
          return new Promise((resolve) => {
            var flag_header = false;
            var d_max = 0;
            mindemo_3D_data.forEach((elements) => {
              if (flag_header) {
                flag_header = false;
              } else {
                var d = Number(elements[5]); //// density
                if (d > d_max) {
                  d_max = d;
                }
              }
            });
            flag_header = true;
            mindemo_3D_data.forEach((elements) => {
              if (flag_header) {
                flag_header = false;
              } else {
                //// elements[0]; //// id
                var x = Number(elements[1]); //// x
                x =
                  Math.round(Math.pow(10, round_num) * x) /
                  Math.pow(10, round_num);
                var y = Number(elements[2]); //// y
                y =
                  Math.round(Math.pow(10, round_num) * y) /
                  Math.pow(10, round_num);
                var z = Number(elements[3]); //// z
                z =
                  Math.round(Math.pow(10, round_num) * z) /
                  Math.pow(10, round_num);
                //// elements[4]; //// cost
                var d = Number(elements[5]); //// density
                var box_weight = Math.cbrt(d / d_max);
                var k = Math.floor(materials_num * box_weight);
                if (k >= materials_num) {
                  k = materials_num - 1;
                }
                if (box_size_list[k] > 0) {
                  var d_len: number;
                  if (shape.value <= 0) {
                    d_len = scaling.value;
                  } else {
                    d_len = scaling.value * box_size_list[k];
                  }
                  var box = gen_box(
                    elements[0],
                    x,
                    y,
                    z,
                    k,
                    box_weight,
                    shape.value,
                    hue.value,
                    mindemo_3D_step_size,
                    scaling.value,
                    scene
                  );
                  if (shape.value != 0) {
                    box.scaling.x = d_len;
                    box.scaling.y = d_len;
                    box.scaling.z = d_len;
                    box.position = new Vector3(x, y, z);
                    box.isVisible = true;
                    box.material = box_mat_list[k];
                  }
                  box_mesh_list.push(box);
                  box_weight_list.push(box_weight);
                }
              }
            });
            resolve(true);
          });
        })
        .then(() => {
          return new Promise((resolve) => {
            if (shape.value == 0) {
              for (var i = 0; i < box_mesh_list.length; i++) {
                box_mesh_list[i].mesh = set_box_visibility(
                  box_mesh_list[i].mesh,
                  box_weight_list[i],
                  normalized_density_lower_limit.value,
                  normalized_density_upper_limit.value,
                  x_lower_limit.value,
                  x_upper_limit.value,
                  y_lower_limit.value,
                  y_upper_limit.value,
                  z_lower_limit.value,
                  z_upper_limit.value,
                  r_lower_limit.value,
                  r_upper_limit.value
                );
              }
            } else {
              for (var i = 0; i < box_mesh_list.length; i++) {
                box_mesh_list[i] = set_box_visibility(
                  box_mesh_list[i],
                  box_weight_list[i],
                  normalized_density_lower_limit.value,
                  normalized_density_upper_limit.value,
                  x_lower_limit.value,
                  x_upper_limit.value,
                  y_lower_limit.value,
                  y_upper_limit.value,
                  z_lower_limit.value,
                  z_upper_limit.value,
                  r_lower_limit.value,
                  r_upper_limit.value
                );
              }
            }
            resolve(true);
          });
        });
    }

    function load_params_from_csv_txt(key: string, value: number) {
      switch (key) {
        case "uniformity":
          marginal_density_uniformity.set_slider_value(value);
          break;
        case "xy":
          density_param_xy.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*xy"] = value;
          break;
        case "xz":
          density_param_xz.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*xz"] = value;
          break;
        case "yz":
          // density_param_yz.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*yz"] = value;
          break;
        case "xxy":
          density_param_xxy.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*xxy"] = value;
          break;
        case "xxz":
          density_param_xxz.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*xxz"] = value;
          break;
        case "xyy":
          // density_param_xyy.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*xyy"] = value;
          break;
        case "xyz":
          density_param_xyz.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*xyz"] = value;
          break;
        case "xzz":
          // density_param_xzz.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*xzz"] = value;
          break;
        case "yyz":
          // density_param_yyz.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*yyz"] = value;
          break;
        case "yzz":
          // density_param_yzz.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*yzz"] = value;
          break;
        case "|x+y+z|":
          density_param_abs_x_y_z.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*abs(x+y+z)"] = value;
          break;
        case "|xy+yz+zx|":
          density_param_abs_xy_yz_zx.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*abs(xy+yz+zx)"] = value;
          break;
        case "|xyz|":
          density_param_abs_xyz.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*abs(xyz)"] = value;
          break;
        case "sin:amp":
          density_param_sin_amp.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["@*sin(1+r)"] = value;
          break;
        case "sin:freq":
          density_param_sin_freq.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["sin(1+@*r)"] = value;
          break;
        case "sin:phase":
          density_param_sin_phase.set_slider_value(value);
          mindemo_3D_marginal_params_dict_list["sin(@*1+r)"] = value;
          break;
        case "custom":
          mindemo_3D_marginal_params_dict_list["custom"] = value;
          break;
        case "step_size":
          xyz_step_size.set_slider_value(value);
          break;
        case "scale":
          scaling.set_slider_value(value);
          break;
        case "shape":
          shape.set_slider_value(value);
          break;
        case "background":
          background.set_slider_value(value);
          background.set_background(value);
          break;
        case "color":
          hue.set_slider_value(value);
          break;
        case "opacity":
          opacity.set_slider_value(value);
          break;
        case "light":
          lighting.set_slider_value(value);
          break;
        default:
          break;
      }
    }

    function draw_mindemo_3D_from_csv_file(
      data_txt: string,
      flag_header: boolean
    ) {
      Promise.resolve()
        .then(() => {
          return new Promise((resolve) => {
            if (box_mesh_list.length > 0) {
              box_mesh_list.forEach((mesh) => {
                mesh.dispose();
                if (shape.value == 0) {
                  mesh = null;
                }
              });
              box_mesh_list = [];
            }
            box_weight_list = [];
            var data_array = [];
            var data_string = data_txt.split("\n");
            for (var i = 0; i < data_string.length; i++) {
              data_array[i] = data_string[i].split(",");
            }
            marginal_density_uniformity.reset = true;
            density_param_xy.reset = true;
            density_param_xz.reset = true;
            // density_param_yz.reset = true;
            density_param_xxy.reset = true;
            density_param_xxz.reset = true;
            // density_param_xyy.reset = true;
            density_param_xyz.reset = true;
            // density_param_xzz.reset = true;
            // density_param_yyz.reset = true;
            // density_param_yzz.reset = true;
            density_param_abs_x_y_z.reset = true;
            density_param_abs_xy_yz_zx.reset = true;
            density_param_abs_xyz.reset = true;
            density_param_sin_amp.reset = true;
            density_param_sin_freq.reset = true;
            density_param_sin_phase.reset = true;
            xyz_step_size.reset = true;
            scaling.reset = true;
            shape.reset = true;
            background.reset = true;
            hue.reset = true;
            opacity.reset = true;
            lighting.reset = true;
            resolve(data_array);
          });
        })
        .then((data_array) => {
          return new Promise((resolve) => {
            var x_abs_max = 0;
            var y_abs_max = 0;
            var z_abs_max = 0;
            var c_abs_max = 0;
            var d_abs_max = 0;
            data_array.forEach((elements) => {
              if (flag_header) {
                flag_header = false;
              } else {
                if (Number(elements[1]) > x_abs_max) {
                  //// x
                  x_abs_max = elements[1];
                }
                if (Number(elements[2]) > y_abs_max) {
                  //// y
                  y_abs_max = elements[2];
                }
                if (Number(elements[3]) > z_abs_max) {
                  //// z
                  z_abs_max = elements[3];
                }
                if (Number(elements[4]) > c_abs_max) {
                  //// cost
                  c_abs_max = elements[4];
                }
                if (Number(elements[5]) > d_abs_max) {
                  //// density
                  d_abs_max = elements[5];
                }
                if (elements[6] != null) {
                  if (elements[6].length > 0) {
                    if (elements[7] != null) {
                      if (elements[7].length > 0) {
                        load_params_from_csv_txt( elements[6].toString(), Number(elements[7]) ) ;
                      }
                    }
                  }
                }
              }
            });
            gen_materials(materials_num);
            mindemo_3D_data = [];
            flag_header = true;
            data_array.forEach((elements) => {
              if (flag_header) {
                flag_header = false;
              } else {
                //// elements[0]; //// id
                var x = Number(elements[1]); //// x
                x = x / Math.max(1, x_abs_max);
                x =
                  Math.round(Math.pow(10, round_num) * x) /
                  Math.pow(10, round_num);
                var y = Number(elements[2]); //// y
                y = y / Math.max(1, y_abs_max);
                y =
                  Math.round(Math.pow(10, round_num) * y) /
                  Math.pow(10, round_num);
                var z = Number(elements[3]); //// z
                z = z / Math.max(1, z_abs_max);
                z =
                  Math.round(Math.pow(10, round_num) * z) /
                  Math.pow(10, round_num);
                var c = Number(elements[4]); //// cost
                c = c / Math.max(1, c_abs_max);
                var d = Number(elements[5]); //// density
                d = d / Math.max(1, d_abs_max);
                mindemo_3D_data.push([
                  elements[0],
                  x,
                  y,
                  z,
                  Number(elements[4]),
                  d,
                ]);
                var box_weight = Math.cbrt(d / d_abs_max);
                var k = Math.floor(materials_num * box_weight);
                if (k >= materials_num) {
                  k = materials_num - 1;
                }
                if (box_size_list[k] > 0) {
                  var d_len: number;
                  if (shape.value <= 0) {
                    d_len = scaling.value;
                  } else {
                    d_len = scaling.value * box_size_list[k];
                  }
                  var box = gen_box(
                    elements[0],
                    x,
                    y,
                    z,
                    k,
                    box_weight,
                    shape.value,
                    hue.value,
                    mindemo_3D_step_size,
                    scaling.value,
                    scene
                  );
                  if (shape.value != 0) {
                    box.scaling.x = d_len;
                    box.scaling.y = d_len;
                    box.scaling.z = d_len;
                    box.position = new Vector3(x, y, z);
                    box.isVisible = true;
                    box.material = box_mat_list[k];
                  }
                  box_mesh_list.push(box);
                  box_weight_list.push(box_weight);
                }
              }
            });
            resolve(true);
          });
        })
        .then(() => {
          return new Promise((resolve) => {
            if (shape.value == 0) {
              for (var i = 0; i < box_mesh_list.length; i++) {
                box_mesh_list[i].mesh = set_box_visibility(
                  box_mesh_list[i].mesh,
                  box_weight_list[i],
                  normalized_density_lower_limit.value,
                  normalized_density_upper_limit.value,
                  x_lower_limit.value,
                  x_upper_limit.value,
                  y_lower_limit.value,
                  y_upper_limit.value,
                  z_lower_limit.value,
                  z_upper_limit.value,
                  r_lower_limit.value,
                  r_upper_limit.value
                );
              }
            } else {
              for (var i = 0; i < box_mesh_list.length; i++) {
                box_mesh_list[i] = set_box_visibility(
                  box_mesh_list[i],
                  box_weight_list[i],
                  normalized_density_lower_limit.value,
                  normalized_density_upper_limit.value,
                  x_lower_limit.value,
                  x_upper_limit.value,
                  y_lower_limit.value,
                  y_upper_limit.value,
                  z_lower_limit.value,
                  z_upper_limit.value,
                  r_lower_limit.value,
                  r_upper_limit.value
                );
              }
            }
            marginal_density_uniformity.reset = false;
            density_param_xy.reset = false;
            density_param_xz.reset = false;
            // density_param_yz.reset = false;
            density_param_xxy.reset = false;
            density_param_xxz.reset = false;
            // density_param_xyy.reset = false;
            density_param_xyz.reset = false;
            // density_param_xzz.reset = false;
            // density_param_yyz.reset = false;
            // density_param_yzz.reset = false;
            density_param_abs_x_y_z.reset = false;
            density_param_abs_xy_yz_zx.reset = false;
            density_param_abs_xyz.reset = false;
            density_param_sin_amp.reset = false;
            density_param_sin_freq.reset = false;
            density_param_sin_phase.reset = false;
            xyz_step_size.reset = false;
            scaling.reset = false;
            shape.reset = false;
            background.reset = false;
            hue.reset = false;
            opacity.reset = false;
            lighting.reset = false;
            // create_mindemo_3D_data_table(mindemo_3D_data);
            resolve(true);
          });
        });
    }

    //// UI
    var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    //// joint_density_slider_panel
    var density_slider_panel = new StackPanel();
    density_slider_panel.isVertical = true;
    density_slider_panel.width = "200px";
    density_slider_panel.height = "660px";
    density_slider_panel.horizontalAlignment =
      Control.HORIZONTAL_ALIGNMENT_LEFT;
    density_slider_panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    density_slider_panel.background = "";
    advancedTexture.addControl(density_slider_panel);
    //// marginal_density_slider_panel
    var marginal_density_slider_panel = new StackPanel();
    marginal_density_slider_panel.isVertical = true;
    marginal_density_slider_panel.width = "200px";
    marginal_density_slider_panel.height = "60px";
    marginal_density_slider_panel.background = "tan";
    density_slider_panel.addControl(marginal_density_slider_panel);
    //// marginal_density_uniformity
    marginal_density_slider_panel.addControl(
      marginal_density_uniformity.header
    );
    marginal_density_slider_panel.addControl(
      marginal_density_uniformity.slider
    );
    //// joint_density_slider_panel
    var joint_density_slider_panel = new StackPanel();
    joint_density_slider_panel.isVertical = true;
    joint_density_slider_panel.width = "200px";
    joint_density_slider_panel.height = "600px";
    joint_density_slider_panel.background = "bisque";
    density_slider_panel.addControl(joint_density_slider_panel);
    //// xy
    joint_density_slider_panel.addControl(density_param_xy.header);
    joint_density_slider_panel.addControl(density_param_xy.slider);
    //// xz
    joint_density_slider_panel.addControl(density_param_xz.header);
    joint_density_slider_panel.addControl(density_param_xz.slider);
    // //// yz
    // joint_density_slider_panel.addControl(density_param_yz.header);
    // joint_density_slider_panel.addControl(density_param_yz.slider);
    //// xxy
    joint_density_slider_panel.addControl(density_param_xxy.header);
    joint_density_slider_panel.addControl(density_param_xxy.slider);
    //// xxz
    joint_density_slider_panel.addControl(density_param_xxz.header);
    joint_density_slider_panel.addControl(density_param_xxz.slider);
    // //// xyy
    // joint_density_slider_panel.addControl(density_param_xyy.header);
    // joint_density_slider_panel.addControl(density_param_xyy.slider);
    //// xyz
    joint_density_slider_panel.addControl(density_param_xyz.header);
    joint_density_slider_panel.addControl(density_param_xyz.slider);
    // //// xzz
    // joint_density_slider_panel.addControl(density_param_xzz.header);
    // joint_density_slider_panel.addControl(density_param_xzz.slider);
    // //// yyz
    // joint_density_slider_panel.addControl(density_param_yyz.header);
    // joint_density_slider_panel.addControl(density_param_yyz.slider);
    // //// yzz
    // joint_density_slider_panel.addControl(density_param_yzz.header);
    // joint_density_slider_panel.addControl(density_param_yzz.slider);
    //// abs
    joint_density_slider_panel.addControl(density_param_abs_x_y_z.header);
    joint_density_slider_panel.addControl(density_param_abs_x_y_z.slider);
    joint_density_slider_panel.addControl(density_param_abs_xy_yz_zx.header);
    joint_density_slider_panel.addControl(density_param_abs_xy_yz_zx.slider);
    joint_density_slider_panel.addControl(density_param_abs_xyz.header);
    joint_density_slider_panel.addControl(density_param_abs_xyz.slider);
    //// sin:amp
    joint_density_slider_panel.addControl(density_param_sin_amp.header);
    joint_density_slider_panel.addControl(density_param_sin_amp.slider);
    //// sin:freq
    joint_density_slider_panel.addControl(density_param_sin_freq.header);
    joint_density_slider_panel.addControl(density_param_sin_freq.slider);
    //// sin:phase
    joint_density_slider_panel.addControl(density_param_sin_phase.header);
    joint_density_slider_panel.addControl(density_param_sin_phase.slider);

    //// env_panel
    var env_panel = new StackPanel();
    env_panel.isVertical = false;
    env_panel.width = "1080px";
    env_panel.height = "60px";
    env_panel.background = "lightblue";
    env_panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    env_panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    advancedTexture.addControl(env_panel);
    //// button_panel
    var button_panel = new StackPanel();
    button_panel.isVertical = false;
    button_panel.width = "270px";
    button_panel.height = "60px";
    button_panel.background = "darkseagreen";
    // button_panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    // button_panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    env_panel.addControl(button_panel);
    //// reset
    var reset_button = Button.CreateSimpleButton(
      "reset_button",
      "Reset [Space]"
    );
    reset_button.width = "90px";
    reset_button.height = "40px";
    reset_button.color = "black";
    reset_button.paddingLeft = "10px";
    reset_button.paddingRight = "0px";
    reset_button.background = "lightpink";
    reset_button.fontSize = 12;
    button_panel.addControl(reset_button);
    function reset_density_params() {
      marginal_density_uniformity.reset_marginal_params();
      density_param_xy.reset_mindemo_3D_params();
      density_param_xz.reset_mindemo_3D_params();
      // density_param_yz.reset_mindemo_3D_params();
      density_param_xxy.reset_mindemo_3D_params();
      density_param_xxz.reset_mindemo_3D_params();
      // density_param_xyy.reset_mindemo_3D_params();
      density_param_xyz.reset_mindemo_3D_params();
      // density_param_xzz.reset_mindemo_3D_params();
      // density_param_yyz.reset_mindemo_3D_params();
      // density_param_yzz.reset_mindemo_3D_params();
      density_param_abs_x_y_z.reset_mindemo_3D_params();
      density_param_abs_xy_yz_zx.reset_mindemo_3D_params();
      density_param_abs_xyz.reset_mindemo_3D_params();
      density_param_sin_amp.reset_mindemo_3D_params();
      density_param_sin_freq.reset_mindemo_3D_params();
      density_param_sin_phase.reset_mindemo_3D_params();
      draw_mindemo_3D_from_params();
      marginal_density_uniformity.reset = false;
      density_param_xy.reset = false;
      density_param_xz.reset = false;
      // density_param_yz.reset = false
      density_param_xxy.reset = false;
      density_param_xxz.reset = false;
      // density_param_xyy.reset = false
      density_param_xyz.reset = false;
      // density_param_xzz.reset = false
      // density_param_yyz.reset = false
      // density_param_yzz.reset = false
      density_param_abs_x_y_z.reset = false;
      density_param_abs_xy_yz_zx.reset = false;
      density_param_abs_xyz.reset = false;
      density_param_sin_amp.reset = false;
      density_param_sin_freq.reset = false;
      density_param_sin_phase.reset = false;
      xyz_step_size.reset = false;
      scaling.reset = false;
      shape.reset = false;
      background.reset = false;
      hue.reset = false;
      opacity.reset = false;
      lighting.reset = false;
    }
    reset_button.onPointerClickObservable.add((event) => {
      playButtonClickSound();
      reset_density_params();
    });
    document.addEventListener("keydown", (event) => {
      if (String(event.key) == " ") {
        playButtonClickSound();
        reset_density_params();
      }
    });
    //// load
    var load_button = Button.CreateSimpleButton("load_button", "Load [z]");
    load_button.width = "90px";
    load_button.height = "40px";
    load_button.paddingLeft = "5px";
    load_button.paddingRight = "5px";
    load_button.color = "black";
    load_button.background = "gold";
    load_button.fontSize = 14;
    button_panel.addControl(load_button);
    function load_mindemo() {
      var element_input = document.createElement("input");
      element_input.type = "file";
      element_input.addEventListener("change", (event) => {
        var inputfile = element_input.files[0];
        var reader = new FileReader();
        reader.readAsText(inputfile);
        reader.addEventListener(
          "load",
          (event) => {
            draw_mindemo_3D_from_csv_file(reader.result, true);
            playButtonClickSound();
          },
          true
        );
      });
      element_input.click();
    }
    load_button.onPointerClickObservable.add((event) => {
      playButtonClickSound();
      load_mindemo();
    });
    document.addEventListener("keydown", (event) => {
      if (String(event.key) == "z") {
        playButtonClickSound();
        load_mindemo();
      }
    });
    //// save
    var save_button = Button.CreateSimpleButton("save_button", "Save [Z]");
    save_button.width = "90px";
    save_button.height = "40px";
    save_button.paddingLeft = "0px";
    save_button.paddingRight = "10px";
    save_button.color = "black";
    save_button.background = "aquamarine";
    save_button.fontSize = 14;
    button_panel.addControl(save_button);
    var save_params_num = 19;
    function gen_filename_from_date() {
      var date = new Date();
      var year = date.getFullYear();
      var month = (date.getMonth() + 1).toString().padStart(2, "0");
      var day = date.getDate().toString().padStart(2, "0");
      var hour = date.getHours().toString().padStart(2, "0");
      var minute = date.getMinutes().toString().padStart(2, "0");
      var second = date.getSeconds().toString().padStart(2, "0");
      var filename = year + month + day + hour + minute + second;
      return filename;
    }
    function gen_csv_txt_from_param(i: number): string {
      var csv_txt = ",";
      switch (i) {
        case 0:
          csv_txt = csv_txt + "uniformity,";
          csv_txt = csv_txt + marginal_density_uniformity.value.toString();
          break;
        case 1:
          var key = "@*xy";
          csv_txt = csv_txt + "xy" + ",";
          csv_txt = csv_txt + mindemo_3D_params_dict[key].toString();
          break;
        case 2:
          var key = "@*xz";
          csv_txt = csv_txt + "xz" + ",";
          csv_txt = csv_txt + mindemo_3D_params_dict[key].toString();
          break;
        case 3:
          var key = "@*xxy";
          csv_txt = csv_txt + "xxy" + ",";
          csv_txt = csv_txt + mindemo_3D_params_dict[key].toString();
          break;
        case 4:
          var key = "@*xxz";
          csv_txt = csv_txt + "xxz" + ",";
          csv_txt = csv_txt + mindemo_3D_params_dict[key].toString();
          break;
        case 5:
          var key = "@*xyz";
          csv_txt = csv_txt + "xyz" + ",";
          csv_txt = csv_txt + mindemo_3D_params_dict[key].toString();
          break;
        case 6:
          var key = "@*abs(x+y+z)";
          csv_txt = csv_txt + "|x+y+z|" + ",";
          csv_txt = csv_txt + mindemo_3D_params_dict[key].toString();
          break;
        case 7:
          var key = "@*abs(xy+yz+zx)";
          csv_txt = csv_txt + "|xy+yz+zx|" + ",";
          csv_txt = csv_txt + mindemo_3D_params_dict[key].toString();
          break;
        case 8:
          var key = "@*abs(xyz)";
          csv_txt = csv_txt + "|xyz|" + ",";
          csv_txt = csv_txt + mindemo_3D_params_dict[key].toString();
          break;
        case 9:
          var key = "@*sin(1+r)";
          csv_txt = csv_txt + "sin:amp" + ",";
          csv_txt = csv_txt + mindemo_3D_params_dict[key].toString();
          break;
        case 10:
          var key = "sin(1+@*r)";
          csv_txt = csv_txt + "sin:freq" + ",";
          csv_txt = csv_txt + mindemo_3D_params_dict[key].toString();
          break;
        case 11:
          var key = "sin(@*1+r)";
          csv_txt = csv_txt + "sin:phase" + ",";
          csv_txt = csv_txt + mindemo_3D_params_dict[key].toString();
          break;
        case 12:
          csv_txt = csv_txt + "step_size" + ",";
          csv_txt = csv_txt + mindemo_3D_step_size.toString();
          break;
        case 13:
          csv_txt = csv_txt + "scale" + ",";
          csv_txt = csv_txt + scaling.value.toString();
          break;
        case 14:
          csv_txt = csv_txt + "shape" + ",";
          csv_txt = csv_txt + shape.value.toString();
          break;
        case 15:
          csv_txt = csv_txt + "background" + ",";
          csv_txt = csv_txt + background.value.toString();
          break;
        case 16:
          csv_txt = csv_txt + "color" + ",";
          csv_txt = csv_txt + hue.value.toString();
          break;
        case 17:
          csv_txt = csv_txt + "opacity" + ",";
          csv_txt = csv_txt + opacity.value.toString();
          break;
        case 18:
          csv_txt = csv_txt + "light" + ",";
          csv_txt = csv_txt + lighting.value.toString();
          break;
        default:
          csv_txt = csv_txt + ",";
          break;
      }
      return csv_txt;
    }
    function save_mindemo() {
      var csv_txt = "id, x, y, z, cost, density, param_key, param_value";
      if (mindemo_3D_data.length >= save_params_num) {
        for (var i = 0; i < mindemo_3D_data.length; i++) {
          csv_txt = csv_txt + "\n";
          csv_txt = csv_txt + mindemo_3D_data[i].join(",");
          csv_txt = csv_txt + gen_csv_txt_from_param(i);
        }
      } else {
        for (var i = 0; i < save_params_num; i++) {
          csv_txt = csv_txt + "\n";
          if (i < mindemo_3D_data.length) {
            csv_txt = csv_txt + mindemo_3D_data[i].join(",");
          } else {
            csv_txt = csv_txt + ",,,,,";
          }
          csv_txt = csv_txt + gen_csv_txt_from_param(i);
        }
      }
      var bom = new Uint8Array([0xef, 0xbb, 0xbf]);
      var blob = new Blob([bom, csv_txt], { type: "text/csv" });
      var element_a = document.createElement("a");
      element_a.download = "mindemo." + gen_filename_from_date() + ".csv";
      element_a.href = URL.createObjectURL(blob);
      element_a.click();
      URL.revokeObjectURL(element_a.href);
    }
    save_button.onPointerClickObservable.add((event) => {
      playButtonClickSound();
      save_mindemo();
    });
    document.addEventListener("keydown", (event) => {
      if (String(event.key) == "Z") {
        playButtonClickSound();
        save_mindemo();
      }
    });
    //// axes
    var axes_panel = new StackPanel();
    axes_panel.isVertical = true;
    axes_panel.height = "60px";
    axes_panel.width = "80px";
    env_panel.addControl(axes_panel);
    var axes_header = new TextBlock();
    axes_header.text = "axes [" + char_axes_off + "," + char_axes_on + "]";
    axes_header.fontSize = 16;
    axes_header.height = "35px";
    axes_header.width = "80px";
    axes_header.paddingLeft = "5px";
    axes_header.paddingTop = "5px";
    axes_header.color = "black";
    axes_panel.addControl(axes_header);
    var axes_checkbox = new Checkbox();
    axes_checkbox.width = "15px";
    axes_checkbox.height = "20px";
    axes_checkbox.paddingBottom = "5px";
    axes_checkbox.isChecked = true;
    axes_checkbox.color = "black";
    axes_checkbox.background = "white";
    axes_panel.addControl(axes_checkbox);
    axes_checkbox.onIsCheckedChangedObservable.add(function (isChecked) {
      playButtonClickSound();
      if (isChecked) {
        global_axes.scaleLines = 1.2;
      } else {
        global_axes.scaleLines = 0.0;
      }
    });
    document.addEventListener("keydown", (event) => {
      if (String(event.key) == char_axes_off) {
        axes_checkbox.isChecked = false;
        // global_axes.scaleLines = 0.0;
      } else if (String(event.key) == char_axes_on) {
        axes_checkbox.isChecked = true;
        // global_axes.scaleLines = 1.2;
      }
    });
    //// background
    var background_panel = new StackPanel();
    background_panel.isVertical = true;
    background_panel.height = "60px";
    background_panel.width = "180px";
    env_panel.addControl(background_panel);
    background_panel.addControl(background.header);
    background_panel.addControl(background.slider);
    //// hue
    var hue_panel = new StackPanel();
    hue_panel.isVertical = true;
    hue_panel.height = "60px";
    hue_panel.width = "180px";
    env_panel.addControl(hue_panel);
    hue_panel.addControl(hue.header);
    hue_panel.addControl(hue.slider);
    //// opacity
    var opacity_panel = new StackPanel();
    opacity_panel.isVertical = true;
    opacity_panel.height = "60px";
    opacity_panel.width = "180px";
    env_panel.addControl(opacity_panel);
    opacity_panel.addControl(opacity.header);
    opacity_panel.addControl(opacity.slider);
    //// lighting
    var lighting_panel = new StackPanel();
    lighting_panel.isVertical = true;
    lighting_panel.height = "60px";
    lighting_panel.width = "180px";
    env_panel.addControl(lighting_panel);
    lighting_panel.addControl(lighting.header);
    lighting_panel.addControl(lighting.slider);

    //// viz_slider_panel
    var viz_slider_panel = new StackPanel();
    viz_slider_panel.isVertical = true;
    viz_slider_panel.width = "200px";
    viz_slider_panel.height = "720px";
    viz_slider_panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    viz_slider_panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    advancedTexture.addControl(viz_slider_panel);

    //// box_slider_panel
    var box_slider_panel = new StackPanel();
    box_slider_panel.isVertical = true;
    box_slider_panel.width = "200px";
    box_slider_panel.height = "170px";
    box_slider_panel.background = "lightsalmon";
    viz_slider_panel.addControl(box_slider_panel);
    //// step size
    box_slider_panel.addControl(xyz_step_size.header);
    box_slider_panel.addControl(xyz_step_size.slider);
    //// scaling
    box_slider_panel.addControl(scaling.header);
    box_slider_panel.addControl(scaling.slider);
    /// shape
    box_slider_panel.addControl(shape.header);
    box_slider_panel.addControl(shape.slider);

    //// scanning_slider_panel
    var scanning_slider_panel = new StackPanel();
    scanning_slider_panel.isVertical = true;
    scanning_slider_panel.width = "200px";
    scanning_slider_panel.height = "550px";
    scanning_slider_panel.background = "linen";
    viz_slider_panel.addControl(scanning_slider_panel);
    //// normalized density
    scanning_slider_panel.addControl(normalized_density_lower_limit.header);
    scanning_slider_panel.addControl(normalized_density_lower_limit.slider);
    scanning_slider_panel.addControl(normalized_density_upper_limit.header);
    scanning_slider_panel.addControl(normalized_density_upper_limit.slider);
    //// x
    scanning_slider_panel.addControl(x_lower_limit.header);
    scanning_slider_panel.addControl(x_lower_limit.slider);
    scanning_slider_panel.addControl(x_upper_limit.header);
    scanning_slider_panel.addControl(x_upper_limit.slider);
    //// y
    scanning_slider_panel.addControl(y_lower_limit.header);
    scanning_slider_panel.addControl(y_lower_limit.slider);
    scanning_slider_panel.addControl(y_upper_limit.header);
    scanning_slider_panel.addControl(y_upper_limit.slider);
    //// z
    scanning_slider_panel.addControl(z_lower_limit.header);
    scanning_slider_panel.addControl(z_lower_limit.slider);
    scanning_slider_panel.addControl(z_upper_limit.header);
    scanning_slider_panel.addControl(z_upper_limit.slider);
    //// r
    scanning_slider_panel.addControl(r_lower_limit.header);
    scanning_slider_panel.addControl(r_lower_limit.slider);
    scanning_slider_panel.addControl(r_upper_limit.header);
    scanning_slider_panel.addControl(r_upper_limit.slider);

    //// start_panel
    var start_panel = new StackPanel();
    start_panel.width = "1280px";
    start_panel.height = "720px";
    start_panel.background = "black";
    start_panel.alpha = 0.75;
    start_panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    start_panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(start_panel);
    //// start_button
    var start_button = Button.CreateSimpleButton(
      "Start",
      "Press Space Key to Start"
    );
    start_button.width = "600px";
    start_button.height = "400px";
    start_button.color = "black";
    start_button.paddingLeft = "0px";
    start_button.paddingTop = "320px";
    start_button.background = "white";
    start_button.alpha = 0.75;
    start_button.fontSize = 24;
    start_button.fontWeight = "bold";
    start_panel.addControl(start_button);
    start_button.onPointerClickObservable.add((event) => {
      playButtonClickSound();
      start_panel.removeControl(start_button);
      advancedTexture.removeControl(start_panel);
      camera.attachControl(canvas, true);
    });
    document.addEventListener("keydown", (event) => {
      playButtonClickSound();
      start_panel.removeControl(start_button);
      advancedTexture.removeControl(start_panel);
      camera.attachControl(canvas, true);
    });

    //// run the main render loop
    var sensitivity: number = 0.2;
    engine.runRenderLoop(() => {
      var dr = (camera.radius - camera_radius);
      var da = (camera.alpha - camera_alpha);
      var db = (camera.beta- camera_beta);
      var dx = (camera.position.x - camera_pos_x);
      var dy = (camera.position.y - camera_pos_y);
      var dz = (camera.position.z - camera_pos_z);
      
      if ( Math.abs(dr) > 0.001*sensitivity ){
        var freq = Math.min(1000, Math.max(100, (1000 - (5*camera_radius)**2)));
        playCameraZoomSound(freq);
        camera_radius = camera.radius;
      } else if ( (Math.abs(da) > 0.001*sensitivity) || (Math.abs(db) > 0.001*sensitivity) ){
        var temp_alpha = Math.floor(100*camera_alpha) % 328;
        temp_alpha = (Math.abs(Math.abs(temp_alpha) - 314))/100;
        var freq = 100 + Math.min(1000, Math.max(0, 100*(3.15-camera_beta)))
                    + 10*Math.min(20, Math.max(-20, (-camera_alpha)))
        freq = Math.max(100, freq);
        playCameraRotationSound(freq);
        camera_alpha = camera.alpha;
        camera_beta = camera.beta;
      } else if (
        (Math.abs(dx) > sensitivity) || (Math.abs(dy) > sensitivity) || (Math.abs(dz) > sensitivity)
      ){
        var shift: number = 0;
        if ( (Math.abs(dx)) > (Math.abs(dy)) ) {
          if ( (Math.abs(dx)) > (Math.abs(dz)) ) {
            shift = Math.min(200, Math.max(-200, 20*(dx)));
          } else {
            shift = Math.min(200, Math.max(-200, 20*(dz)));
          }
        } else {
          if ( (Math.abs(dy)) > (Math.abs(dz)) ) {
            shift = Math.min(200, Math.max(-200, 20*(dy)));
          } else {
            shift = Math.min(200, Math.max(-200, 20*(dz)));
          }
        }
        camera_pos_x = camera.position.x;
        camera_pos_y = camera.position.y;
        camera_pos_z = camera.position.z;
        playCameraTrackSound(shift);
      }
      scene.render();
    });
  }
}

new DrawGraph();
