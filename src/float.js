function makeMask(bits) {
    const m = 1 << bits;
    return m - 1;
}

export const FLOAT_STANDARDS = {
    16: {
        expBits: 5,
        fractBits: 10,
        signBit: 15,
        fractMask: makeMask(10),
        expMask: makeMask(5),
        bias: 15,
    },
    32: {
        expBits: 8,
        fractBits: 23,
        signBit: 31,
        fractMask: makeMask(23),
        expMask: makeMask(8),
        bias: 127,
    },
}

export class FloatObj {

    constructor(sign, exp, fract, std) {
        this.sign = sign;
        this.exp = exp;
        this.fract = fract;
        this.standard = std;
    }

    static fromBits(bits, std) {
        const sign = Boolean(bits & (1 << std.signBit));
        const expNotBias = (bits >> std.fractBits) & std.expMask;
        const exp = expNotBias - std.bias;
        const fract = bits & std.fractMask;

        return new this(sign, exp, fract, std);
    }

    static fromFloat(num, std) {
        const sign = num < 0;
        if (sign) num = -num;
        let exp = Math.ceil(Math.log2(num)) - 1;
        const max = Math.pow(2, exp);
        const fractOne = 1 << std.fractBits;
        const ratio = (num / max) - 1.0;
        const fract = Math.floor(ratio * fractOne);

        if (fract > std.fractMask) {
            exp = exp + 1;
        }

        const expM = ((exp + std.bias) & std.expMask) - std.bias;
        const fractM = fract & std.fractMask;

        return new this(sign, expM, fractM, std);
    }

    toBits() {
        const std = this.standard;
        const signB = this.sign ? (1 << std.signBit) : 0;
        const exp = (this.exp + std.bias) & std.expMask;
        const expB = exp << std.fractBits;
        const fractB = this.fract & std.fractMask;
        return signB | expB | fractB;
    }

    toFloat() {
        const std = this.standard;
        const sign = this.sign ? -1 : 1;
        const divisor = 1 << std.fractBits;
        return sign * Math.pow(2, this.exp) * (1.0 + this.fract / divisor);
    }
}
