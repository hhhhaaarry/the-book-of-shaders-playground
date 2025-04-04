// Recursos para los shaders
const shaderResources = {
    functions: {
        name: 'Funciones',
        items: [
            {
                name: 'Smoothstep',
                code: 'smoothstep(0.0, 1.0, x)'
            },
            {
                name: 'Step',
                code: 'step(0.5, x)'
            },
            {
                name: 'Sin',
                code: 'sin(x)'
            },
            {
                name: 'Cos',
                code: 'cos(x)'
            },
            {
                name: 'Tan',
                code: 'tan(x)'
            },
            {
                name: 'Abs',
                code: 'abs(x)'
            },
            {
                name: 'Floor',
                code: 'floor(x)'
            },
            {
                name: 'Ceil',
                code: 'ceil(x)'
            },
            {
                name: 'Fract',
                code: 'fract(x)'
            },
            {
                name: 'Mod',
                code: 'mod(x, y)'
            }
        ]
    },
    vectors: {
        name: 'Vectores',
        items: [
            {
                name: 'Vec2',
                code: 'vec2(x, y)'
            },
            {
                name: 'Vec3',
                code: 'vec3(x, y, z)'
            },
            {
                name: 'Vec4',
                code: 'vec4(x, y, z, w)'
            },
            {
                name: 'Normalizar',
                code: 'normalize(v)'
            },
            {
                name: 'Longitud',
                code: 'length(v)'
            },
            {
                name: 'Distancia',
                code: 'distance(v1, v2)'
            },
            {
                name: 'Producto Punto',
                code: 'dot(v1, v2)'
            },
            {
                name: 'Producto Cruz',
                code: 'cross(v1, v2)'
            }
        ]
    },
    uniforms: {
        name: 'Uniforms',
        items: [
            {
                name: 'Resolución',
                code: 'u_resolution'
            },
            {
                name: 'Mouse',
                code: 'u_mouse'
            },
            {
                name: 'Tiempo',
                code: 'u_time'
            }
        ]
    }
};

export default shaderResources; 