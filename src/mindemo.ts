export function gen_mindemo_3D_html(element: HTMLDivElement) {
    var marginal_params_dict_x: {key?: string;} = {location: 0, scale: 1, mixing_ratio: 1.0, "@*1": 0.1, "@*x": 0.2, "@*xx": 0.3};
    var marginal_params_dict_y: {key?: string;} = {location: 0, scale: 1, mixing_ratio: 1.0, "@*1": -0.1, "@*x": -0.2, "@*xx": -0.3};
    var marginal_params_dict_z: {key?: string;} = {location: 0, scale: 1, mixing_ratio: 1.0, "@*1": 0.1, "@*x": 0.2, "@*xx": 0.3};
    var mindemo_3D_marginal_density_types_list: Array<string> = ["Uniform", "Uniform", "Uniform"];
    var mindemo_3D_marginal_params_dict_list: Array<{key?: string;}> = [marginal_params_dict_x, marginal_params_dict_y, marginal_params_dict_z];
    var mindemo_3D_params_dict: {key?: string;} = {
        "@*xy": 0, "@*xz": 0, "@*yz": 0,
        "@*xxy": 0, "@*xxz": 0, "@*xyy": 0, "@*xyz": 1, "@*xzz": 0, "@*yyz": 0, "@*yzz": 0};
    var mindemo_3D_step_size = 0.25;
    var [N_size, N_rank, N_accum, N_size_prod, marginal_densities_ndarray_list, mindemo_3D_data]:
    [Array<number>, number, Array<number>, number, Array<Array<number>>, Array<Array<number>>] = gen_mindemo_3D_data(
        mindemo_3D_marginal_density_types_list, mindemo_3D_marginal_params_dict_list, mindemo_3D_params_dict, mindemo_3D_step_size);
    var innerHTML: string = "<p>";
    innerHTML = innerHTML + "[N_size]: [";
    innerHTML = innerHTML + String(N_size) + "];";
    innerHTML = innerHTML + "</p><p>";
    innerHTML = innerHTML + "<span style='color: silver'>[N_rank; N_accum; N_size_prod]: </span>";
    innerHTML = innerHTML + String(N_rank) + "; [";
    innerHTML = innerHTML + String(N_accum) + "]; ";
    innerHTML = innerHTML + String(N_size_prod) + ";";
    innerHTML = innerHTML + "</p><p>";
    innerHTML = innerHTML + "<span style='color: silver'>[marginal_densities_ndarray_list]:</span><br />";
    marginal_densities_ndarray_list.forEach((data) => {
        innerHTML = innerHTML + String(data) + ";<br />";
    });
    innerHTML = innerHTML + "</p>";
    mindemo_3D_data.forEach( (data) => {
        innerHTML = innerHTML + "<span style='color: silver'>[x, y, z, cost, density]: </span>";
        innerHTML = innerHTML + "<span style='color: pink'>" + String(data[0]) + "</span>; "
        innerHTML = innerHTML + "<span style='color: lime'>" + String(data[1]) + "</span>; "
        innerHTML = innerHTML + "<span style='color: cyan'>" + String(data[2]) + "</span>; ";
        innerHTML = innerHTML + "<span style='color: orange'>" + String(data[3]) + "</span>; ";
        innerHTML = innerHTML + "<span style='color: gold'>" + String(data[4]) + "</span>;" + "<br />";
    });
    innerHTML = innerHTML + "</p>";
    element.innerHTML = innerHTML;
}

export function gen_mindemo_3D_data(
    mindemo_3D_marginal_density_types_list: Array<string>,
    mindemo_3D_marginal_params_dict_list: Array<{key?: string;}>,
    mindemo_3D_params_dict: {key?: string;},
    mindemo_3D_step_size: number):
    [Array<number>, number, Array<number>, number, Array<Array<number>>, Array<Array<number>>] {
    var xyz_min = -1.00000001;
    var xyz_max = 1.00000001;
    var xyz_origin = (xyz_min + xyz_max)/2;
    var x_ndarray: Array<number> = [xyz_origin];
    var y_ndarray: Array<number> = [xyz_origin];
    var z_ndarray: Array<number> = [xyz_origin];
    if( (mindemo_3D_step_size > 0) && (mindemo_3D_step_size < Math.abs(xyz_max - xyz_origin)) ){
        var xyz_n_num = Math.floor( Math.abs(xyz_origin - xyz_min) / mindemo_3D_step_size );
        var xyz_p_num = Math.floor( Math.abs(xyz_max - xyz_origin) / mindemo_3D_step_size );
        for (var i = 1; i <= xyz_n_num; i++) {
            x_ndarray.push(i*mindemo_3D_step_size);
            y_ndarray.push(i*mindemo_3D_step_size);
            z_ndarray.push(i*mindemo_3D_step_size);
        }
        for (var i = 1; i <= xyz_p_num; i++) {
            x_ndarray.push(-i*mindemo_3D_step_size);
            y_ndarray.push(-i*mindemo_3D_step_size);
            z_ndarray.push(-i*mindemo_3D_step_size);
        }
    } else{
        x_ndarray = [xyz_min, xyz_origin, xyz_max];
        y_ndarray = [xyz_min, xyz_origin, xyz_max];
        z_ndarray = [xyz_min, xyz_origin, xyz_max]; 
    }
    x_ndarray.sort((a, b) => {return (a - b)});
    y_ndarray.sort((a, b) => {return (a - b)});
    z_ndarray.sort((a, b) => {return (a - b)});
    var xyz_ndarray_list: Array<Array<number>> = [x_ndarray, y_ndarray, z_ndarray];
    var N_size: Array<number> = [x_ndarray.length, y_ndarray.length, z_ndarray.length];
    var [N_rank, N_accum, N_size_prod]: [number, Array<number>, number] = get_N(N_size);
    var numerical_precision: number = 2e-8;
    var marginal_densities_ndarray_list = gen_marginal_densities_ndarray_list_for_mindemo(
        N_rank, N_size, xyz_ndarray_list, mindemo_3D_marginal_density_types_list,
        mindemo_3D_marginal_params_dict_list, numerical_precision);
    var [cost_tensor, objective_function_value, P_tensor, 
        weighted_cost_tensor, u_vec_list, f_vec_list] = gen_density_for_mindemo_3D(xyz_ndarray_list,
            marginal_densities_ndarray_list,
            N_size, N_rank, N_accum, N_size_prod,
            mindemo_3D_params_dict,
            numerical_precision);
    var mindemo_3D_data: Array<Array<number>> = [];
    var id: number = 0;
    for (var m_index of ndindex(N_size)) {
        var x: number = xyz_ndarray_list[0][m_index[0]];
        var y: number = xyz_ndarray_list[1][m_index[1]];
        var z: number = xyz_ndarray_list[2][m_index[2]];
        var temp_cost_value: number = get_tensor_value_from_multi_index(cost_tensor, m_index, N_rank, N_accum);
        var temp_P_value: number = get_tensor_value_from_multi_index(P_tensor, m_index, N_rank, N_accum);
        mindemo_3D_data.push([id, x, y, z, temp_cost_value, temp_P_value]);
        id = id + 1;
    }
    return [N_size, N_rank, N_accum, N_size_prod, marginal_densities_ndarray_list, mindemo_3D_data]
}

function get_N(N_size: Array<number>): [number, Array<number>, number] {
    if(N_size.length < 1) {
        console.log("Error: N_size is invalid.");
    }
    var N_rank: number = N_size.length;
    var N_accum: Array<number> = new Array<number>(N_rank).fill(1); //// n2*n3*...*nN, n3*n4*...*nN, ... , nN, 1
    for (var i = 0; i < N_rank; i++) {
        if(i==0){
            N_accum[N_rank-i-1] = 1;
        } else {
            N_accum[N_rank-i-1] = N_accum[N_rank-i]*N_size[N_rank-i];
        }
    }
    var N_size_prod: number = N_size[0]*N_accum[0];
    return [N_rank, N_accum, N_size_prod];
}

function get_tensor_flattened_index_from_multi_index(multi_index: Array<number>,
    N_rank: number, N_accum: Array<number>): number{
    var flattened_index: number = 0;
    for (var i = 0; i < N_rank; i++) {
        flattened_index = flattened_index + N_accum[i]*multi_index[i]
    }
    return flattened_index
}

// function get_tensor_multi_index_from_flattened_index(flattened_index: number,
//     N_rank: number, N_accum: Array<number>): Array<number>{
//     var multi_index: Array<number> = [];
//     var remainder: number = flattened_index;
//     for (var i = 0; i < N_rank; i++) {
//         var quotient: number = Math.floor(remainder/N_accum[i]);
//         remainder = remainder % N_accum[i];
//         multi_index.push(quotient);
//     }
//     return multi_index
// }

function get_tensor_value_from_multi_index(target_tensor: Array<number>, multi_index: Array<number>,
    N_rank: number, N_accum: Array<number>): number {
    var flattened_index: number = get_tensor_flattened_index_from_multi_index(multi_index, N_rank, N_accum);
    return target_tensor[flattened_index];
}

function* ndindex(shape: Array<number>) {
    const indices: Array<number> = new Array(shape.length).fill(0);
    const maxIndices: Array<number> = shape.map(dim => dim - 1);
    while (true) {
        yield indices.slice();
        let carry: number = 1;
        for (let i = indices.length - 1; i >= 0; i--) {
            indices[i] += carry;
            if (indices[i] > maxIndices[i]) {
                indices[i] = 0;
                carry = 1;
            } else {
                carry = 0;
                break;
            }
        }
        if (carry) break;
    }
}

function calc_multi_ot(marginal_mass_vectors: Array<Array<number>>, cost_tensor: Array<number>,
    N_size: Array<number>, N_rank: number, N_accum: Array<number>, N_size_prod: number,
    numerical_precision: number=2e-8, ot_speed: number=0.02, ot_stopping_rule: number=0.02, ot_loop_max: number=200):
    [number, Array<number>, Array<number>, Array<Array<number>>, Array<Array<number>>] {
    var K_tensor = cost_tensor.map( (value) => { return Math.exp(- value / ot_speed) } );
    var u_vec_list: Array<Array<number>> = [];
    for (var i = 0; i < N_rank; i++) {
        u_vec_list.push(Array(N_size[i]).fill(1));
    }
    for (var loop = 0; loop < ot_loop_max; loop++) {
        var u_diff = 0;
        for (var i = 0; i < N_rank; i++) {
            for (var j = 0; j < N_size[i]; j++) {
                var temp_u_value = 0;
                var temp_K_value = 1;
                var N_size_sub = [...N_size];
                N_size_sub.splice(i, 1);
                for (var m_sub_index of ndindex(N_size_sub)) {
                    var temp_m_index = [...m_sub_index];
                    temp_m_index.splice(i, 0, j);
                    temp_K_value = get_tensor_value_from_multi_index(K_tensor, temp_m_index, N_rank, N_accum);
                    var temp_u_prod_value = 1;
                    for (var k = 0; k < N_rank; k++) {
                        if (k !== i) {
                            temp_u_prod_value *= u_vec_list[k][temp_m_index[k]];
                        }
                    }
                    temp_u_value += temp_K_value * temp_u_prod_value;
                }
                temp_u_value = marginal_mass_vectors[i][j] / temp_u_value;
                u_diff = Math.max(u_diff, Math.abs((u_vec_list[i][j] - temp_u_value) / (temp_u_value + numerical_precision)));
                u_vec_list[i][j] = temp_u_value;
            }
        }
        if (Math.abs(u_diff) < ot_stopping_rule) {
            break;
        }
    }
    var f_vec_list: Array<Array<number>> = u_vec_list.map(u_vec => {
        return u_vec.map(u => {
            return ot_speed * Math.log(u + numerical_precision)
        })
    });
    const P_tensor = new Array(N_size_prod).fill(0);
    const weighted_cost_tensor = new Array(N_size_prod).fill(0);
    let objective_function_value = 0;
    for (const m_index of ndindex(N_size)) {
        const temp_cost_value = get_tensor_value_from_multi_index(cost_tensor, m_index, N_rank, N_accum);
        let temp_P_value = get_tensor_value_from_multi_index(K_tensor, m_index, N_rank, N_accum);
        for (let k = 0; k < N_rank; k++) {
            temp_P_value *= u_vec_list[k][m_index[k]];
        }
        const flattened_index = get_tensor_flattened_index_from_multi_index(m_index, N_rank, N_accum);
        P_tensor[flattened_index] = temp_P_value;
        weighted_cost_tensor[flattened_index] = temp_P_value * temp_cost_value;
        objective_function_value += weighted_cost_tensor[flattened_index];
    }
    return [objective_function_value, P_tensor, weighted_cost_tensor, u_vec_list, f_vec_list]
}

function calc_sum(vec: Array<number>): number{
    var sum: number = vec.reduce((previous, current) => {
        return previous + current
    });
    return sum
}

function calc_mean(vec: Array<number>): number{
    return calc_sum(vec)/vec.length
}

function calc_sd(vec: Array<number>): number{
    var mu: number = calc_mean(vec);
    var q = vec.map( (element) => {return (element - mu)*(element - mu)} )
    return Math.sqrt(calc_sum(q)/q.length)
}

function gen_marginal_density_ndarray_for_mindemo(x_size: number,
                                            marginal_x_density_type: string = "Uniform",
                                            x_ndarray: null | Array<number> = null,
                                            marginal_x_params_dict: null | {key?: string;} = null,
                                            numerical_precision: number = 2e-8): Array<number> {
    var density_ndarray : Array<number> = new Array(x_size).fill(1);
    if (marginal_x_density_type === "Normal") {
        var x_mu = calc_mean(x_ndarray) + (marginal_x_params_dict?.location || 0);
        var x_sig = calc_sd(x_ndarray);
        if (x_sig > 0) {
            if (marginal_x_params_dict?.scale > 0) {
                x_sig *= marginal_x_params_dict?.scale;
            }
            for (let i = 0; i < x_size; i++) {
                var x_value = x_ndarray[i];
                density_ndarray[i] = Math.exp(-(x_value - x_mu)*(x_value - x_mu)/(2*(x_sig*x_sig))) / (Math.sqrt(2*Math.PI)*x_sig);
            }
        }
    } else if (marginal_x_density_type === "UniNormMix") {
        var x_mu = calc_mean(x_ndarray)
        var x_sig = 0.5*calc_sd(x_ndarray);
        var mixing_ratio = marginal_x_params_dict?.mixing_ratio || 0.0;
        if (x_sig > 0) {
            for (let i = 0; i < x_size; i++) {
                var x_value = x_ndarray[i];
                density_ndarray[i] = mixing_ratio*density_ndarray[i] + (1-mixing_ratio)*Math.exp(-(x_value - x_mu)*(x_value - x_mu)/(2*(x_sig*x_sig))) / (Math.sqrt(2*Math.PI)*x_sig);
            }
        }
    } else if (marginal_x_density_type === "Exp") {
        for (let i = 0; i < x_size; i++) {
            var x_value = x_ndarray[i];
            density_ndarray[i] = 0;
            density_ndarray[i] += (marginal_x_params_dict?.["@*1"] || 0);
            density_ndarray[i] += (marginal_x_params_dict?.["@*x"] || 0) * x_value;
            density_ndarray[i] += (marginal_x_params_dict?.["@*xx"] || 0) * x_value * x_value;
            density_ndarray[i] += (marginal_x_params_dict?.["@*xxx"] || 0) * x_value * x_value * x_value;
            for (let i = 0; i < x_size; i++) {
                density_ndarray[i] += (marginal_x_params_dict?.["@*xxx"] || 0) * x_value ** 3;
                density_ndarray[i] += (marginal_x_params_dict?.["@*xxxx"] || 0) * x_value ** 4;
                density_ndarray[i] += (marginal_x_params_dict?.["@*abs(1+x+xx)"] || 0) *
                    Math.abs(
                        (marginal_x_params_dict?.["abs(@*1+x+xx)"] || 0) +
                        (marginal_x_params_dict?.["abs(1+@*x+xx)"] || 0) * x_value +
                        (marginal_x_params_dict?.["abs(1+x+@*xx)"] || 0) * x_value ** 2
                    );
                density_ndarray[i] += (marginal_x_params_dict?.["@*sin(1+x+xx)"] || 0) *
                    Math.sin(
                        2 * Math.PI *
                        (
                            (marginal_x_params_dict?.["sin(@*1+x+xx)"] || 0) +
                            (marginal_x_params_dict?.["sin(1+@*x+xx)"] || 0) * x_value +
                            (marginal_x_params_dict?.["sin(1+x+@*xx)"] || 0) * x_value ** 2
                        )
                    );
                density_ndarray[i] += (marginal_x_params_dict?.["@*cos(1+x+xx)"] || 0) *
                    Math.cos(
                        2 * Math.PI *
                        (
                            (marginal_x_params_dict?.["cos(@*1+x+xx)"] || 0) +
                            (marginal_x_params_dict?.["cos(1+@*x+xx)"] || 0) * x_value +
                            (marginal_x_params_dict?.["cos(1+x+@*xx)"] || 0) * x_value ** 2
                        )
                    );
            }            
            density_ndarray[i] = Math.exp(density_ndarray[i]);
        }
    } else { //// Uniform
        if (marginal_x_params_dict?.scale > 0) {
            var x_min = marginal_x_params_dict.location - marginal_x_params_dict.scale;
            var x_max = marginal_x_params_dict.location + marginal_x_params_dict.scale;
            for (let i = 0; i < x_size; i++) {
                var x_value = x_ndarray[i];
                if (x_value < x_min - numerical_precision || x_value > x_max + numerical_precision) {
                    density_ndarray[i] = 0;
                }
            }
        }
        if ( calc_sum(density_ndarray) <= 0 ) {
            density_ndarray.fill(1);
        }
    }
    var sum_density: number = calc_sum(density_ndarray);
    density_ndarray = density_ndarray.map( (value) => { return value/sum_density } )
    return density_ndarray;
}

function gen_marginal_densities_ndarray_list_for_mindemo(N_rank: number,
    N_size: Array<number>, xyz_ndarray_list: Array<Array<number>>,
    marginal_density_types_list: Array<string>,
    marginal_params_dict_list: null | Array<{key?: string;}>,
    numerical_precision: number = 2e-8): Array<Array<number>> {
    var marginal_densities_ndarray_list: Array<Array<number>> = [];
    for (let i = 0; i < N_rank; i++) {
        marginal_densities_ndarray_list.push(
            gen_marginal_density_ndarray_for_mindemo(
                N_size[i],
                marginal_density_types_list[i],
                xyz_ndarray_list[i],
                (marginal_params_dict_list? marginal_params_dict_list[i] : null),
                numerical_precision
            )
        );
    }
    return marginal_densities_ndarray_list;
}

function gen_cost_value_for_mindemo_3D(x: number, y: number, z: number, mindemo_3D_params_dict: null | {key?: string;}): number{
    var model = 0;
    model += (mindemo_3D_params_dict?.["@*1"] || 0);
    model += (mindemo_3D_params_dict?.["@*x"] || 0) * x;
    model += (mindemo_3D_params_dict?.["@*y"] || 0) * y;
    model += (mindemo_3D_params_dict?.["@*z"] || 0) * z;
    model += (mindemo_3D_params_dict?.["@*xx"] || 0) * x * x;
    model += (mindemo_3D_params_dict?.["@*xy"] || 0) * x * y;
    model += (mindemo_3D_params_dict?.["@*xz"] || 0) * x * z;
    model += (mindemo_3D_params_dict?.["@*yy"] || 0) * y * y;
    model += (mindemo_3D_params_dict?.["@*yz"] || 0) * y * z;
    model += (mindemo_3D_params_dict?.["@*zz"] || 0) * z * z;
    model += (mindemo_3D_params_dict?.["@*xxx"] || 0) * x * x * x;
    model += (mindemo_3D_params_dict?.["@*xxy"] || 0) * x * x * y;
    model += (mindemo_3D_params_dict?.["@*xxz"] || 0) * x * x * z;
    model += (mindemo_3D_params_dict?.["@*xyy"] || 0) * x * y * y;
    model += (mindemo_3D_params_dict?.["@*xyz"] || 0) * x * y * z;
    model += (mindemo_3D_params_dict?.["@*xzz"] || 0) * x * z * z;
    model += (mindemo_3D_params_dict?.["@*yyy"] || 0) * y * y * y;
    model += (mindemo_3D_params_dict?.["@*yyz"] || 0) * y * y * z;
    model += (mindemo_3D_params_dict?.["@*yzz"] || 0) * y * z * z;
    model += (mindemo_3D_params_dict?.["@*zzz"] || 0) * z * z * z;
    model += (mindemo_3D_params_dict?.["@*abs(x+y+z)"] || 0) * Math.abs(x+y+z);
    model += (mindemo_3D_params_dict?.["@*abs(xy+yz+zx)"] || 0) * Math.abs(x*y+y*z+z*x);
    model += (mindemo_3D_params_dict?.["@*abs(xyz)"] || 0) * Math.abs(x*y*z);
    var sin_amp = (mindemo_3D_params_dict?.["@*sin(1+r)"] || 0);
    var sin_phase = (mindemo_3D_params_dict?.["sin(@*1+r)"] || 0);
    var sin_freq = (mindemo_3D_params_dict?.["sin(1+@*r)"] || 0);
    model += sin_amp*Math.sin(2*Math.PI*(sin_phase + sin_freq*Math.sqrt(x*x+y*y+z*z)));
    var custom = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
    model += (mindemo_3D_params_dict?.["custom"] || 0) * custom;
    model *= -1;
    return model;
}

function gen_cost_tensor_for_mindemo_3D(xyz_ndarray_list: Array<Array<number>>,
    N_size: Array<number>, N_rank: number, N_accum: Array<number>, N_size_prod: number,
    mindemo_3D_params_dict: null | {key?: string;},
    numerical_precision: number=2e-8): Array<number> {
    var cost_tensor: Array<number> = new Array(N_size_prod).fill(0);
    for (let m_index of ndindex(N_size)) {
        var temp_index = get_tensor_flattened_index_from_multi_index(m_index, N_rank, N_accum);
        cost_tensor[temp_index] = gen_cost_value_for_mindemo_3D(xyz_ndarray_list[0][m_index[0]],
            xyz_ndarray_list[1][m_index[1]], xyz_ndarray_list[2][m_index[2]], mindemo_3D_params_dict);
    }
    return cost_tensor;
}

function gen_density_for_mindemo_3D(xyz_ndarray_list: Array<Array<number>>,
    marginal_densities_ndarray_list: Array<Array<number>>,
    N_size: Array<number>, N_rank: number, N_accum: Array<number>, N_size_prod: number,
    mindemo_3D_params_dict: null | {key?: string;},
    numerical_precision: number=2e-8):
    [Array<number>, number, Array<number>, Array<number>, Array<Array<number>>, Array<Array<number>>] {
    var cost_tensor: Array<number> = gen_cost_tensor_for_mindemo_3D(
        xyz_ndarray_list, N_size, N_rank, N_accum, N_size_prod, mindemo_3D_params_dict, numerical_precision);
    var ot_speed: number = 1.0; //// ot_speed=0.02 -(mindemo)-> ot_speed=1.0
    var ot_stopping_rule: number = 0.02;
    var ot_loop_max: number = 200;
    var [objective_function_value, P_tensor, weighted_cost_tensor, u_vec_list, f_vec_list]:
    [number, Array<number>, Array<number>, Array<Array<number>>, Array<Array<number>>] = calc_multi_ot(
        marginal_densities_ndarray_list, cost_tensor, //// normalized_cost_tensor -(mindemo)-> cost_tensor
                           N_size, N_rank, N_accum, N_size_prod,
                           numerical_precision,
        ot_speed, ot_stopping_rule, ot_loop_max);
    return [cost_tensor, objective_function_value, P_tensor, weighted_cost_tensor, u_vec_list, f_vec_list];
}
