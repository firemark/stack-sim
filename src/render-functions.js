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

    bit8(val) {
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        return '0b' + val.toString(2).padStart(8, '0');
    },

    bit4(val) {
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        return '0b' + val.toString(2).padStart(4, '0');
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
