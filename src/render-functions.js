import { FLOAT_STANDARDS, FloatObj } from "@/float";


function escapeVal(val) {
    return val
        .toString()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    ;
}

export default {

    int(val) {
        return escapeVal(val);
    },

    hex(val) {
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        return '0x' + val.toString(16);
    },

    bit16f(val) { return this.bitNf(val, 16); },
    bit32f(val) { return this.bitNf(val, 32); },
    bitNf(val, bits) {
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        const std = FLOAT_STANDARDS[bits];
        const obj = FloatObj.fromBits(val, std);

        const sign = obj.sign ? '1' : '0';
        const exp = (obj.exp + std.bias).toString(2).padStart(std.expBits, '0');
        const fract = obj.fract.toString(2).padStart(std.fractBits, '0');

        return `${sign}_${exp}_${fract}`;
    },

    bit16(val) { return this.bitN(val, 16); },
    bit8(val)  { return this.bitN(val, 8);  },
    bit4(val)  { return this.bitN(val, 4);  },
    bitN(val, bits) {
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        return '0b' + val.toString(2).padStart(bits, '0');
    },

    dec_u8(val) {
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        return (val & 0xFF).toString();
    },

    dec_s8(val) {
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        const sign = val >> 7;
        return (sign * -128 + (val & 0x7F)).toString();
    },

    float16(val) { return this.floatN(val, 16); },
    float32(val) { return this.floatN(val, 32); },
    floatN(val, bits) {
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        const std = FLOAT_STANDARDS[bits];
        return FloatObj.fromBits(val, std).toFloat().toFixed(4);
    },

    chr(val) {
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        val = val % 255;
        if (val < 32 || val > 126) {
            return escapeVal(val);
        }
        const chr = String.fromCharCode(val);
        return chr + `<small>(${escapeVal(val)})</small>`;
    },

};
