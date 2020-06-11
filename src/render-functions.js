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

    chr(val) {
        if (typeof val !== 'number') {
            return escapeVal(val);
        }
        val = val % 255;
        if (val < 32 || val > 126) {
            return escapeVal(val);
        }
        const chr = String.fromCharCode(val);
        return chr + '<small>(' + escapeVal(val) + ')</small>';
    },

};
