class BaseAction {
    constructor(example, options) {
        this.example = example;
    }

    static create(example, options={}) {
        return new this(example, options);
    }

    BOOM(msg) {
        this.example.throwBoom(msg);
    }

    BOOMSegmentation(val) {
        if (val === undefined) {
            this.BOOM("segmentation fault");
        }
    }

    parseVal(val) {
        return this.example.options.parseVal(val);
    }

    execute() {}
}


class NopAction extends BaseAction {}


class SetAction extends BaseAction {
    execute(toIndex, val) {
        const stack = this.example.stack;
        const valueInStack = stack[toIndex];
        this.BOOMSegmentation(valueInStack);
        stack[toIndex] = this.parseVal(val);
    }
}


class OpAction extends BaseAction {

    constructor(example, options) {
        super(example);
        this.op = options.op;
    }

    static mixin(op) {
        return {
            create: (example, options) => new this(example, { op, ...options }),
        };
    }

    parseTwoVals(toIndex, val) {
        const stack = this.example.stack;
        const valueInStack = stack[toIndex];
        this.BOOMSegmentation(valueInStack);
        const a = this.parseVal(valueInStack);
        const b = this.parseVal(val);
        return [a, b];
    }
}


class BinOpAction extends OpAction {

    execute(toIndex, val) {
        const stack = this.example.stack;
        const [a, b] = this.parseTwoVals(toIndex, val);
        if (isNaN(a) || isNaN(b)) {
            stack[toIndex] = '???';
        } else {
            stack[toIndex] = eval(`a ${this.op} b`);
        }
    }

}


class IfAction extends OpAction {

    execute(aRaw, bRaw, questionMark, trueIndex, falseIndex) {
        if (questionMark !== '?') {
            console.warn('"if" doesn\'t have a question mark!');
            return;
        }

        const a = this.parseVal(aRaw);
        const b = this.parseVal(bRaw);

        const trueStep = this.parseVal(trueIndex);
        const falseStep = this.parseVal(falseIndex);

        const isTrue = eval(`a ${this.op} b`);
        const step = isTrue ? trueStep: falseStep;
        this.example.nextStep += step - 1;
    }

}


class JmpAction extends BaseAction {
    execute(stepRaw) {
        const step = this.parseVal(stepRaw);
        if (!isNaN(step)) {
            this.example.nextStep = step;
        }
    }
}


class RelJmpAction extends BaseAction {
    execute(stepRaw) {
        const step = this.parseVal(stepRaw);
        if (!isNaN(step)) {
            this.example.nextStep += step;
        }
    }
}


class BitAction extends OpAction {

    constructor(example, options) {
        super(example, options);
        this.bits = options.bits || 8;
    }

    toBits(val) {
        const max = 1 << this.bits;
        const carry = Boolean(val & max);
        const newVal = val & (max - 1);
        return [carry, newVal];
    }

    execute(toIndex, val) {
        const stack = this.example.stack;
        const [a, b] = this.parseTwoVals(toIndex, val);
        if (isNaN(a) || isNaN(b)) {
            stack[toIndex] = '???';
            return;
        }

        const preVal = eval(`a${this.op}b`);
        const [newCarry, newVal] = this.toBits(preVal);
        const flags = this.example.flags;
        flags.carry = newCarry;
        flags.sign = Boolean(newVal >> (this.bits - 1));
        flags.zero = newVal == 0;
        stack[toIndex] = newVal;
    }
}


class SetBitAction extends BitAction {

    constructor(example, options) {
        super(example, options);
        this.bits = options.bits || 8;
    }

    execute(toIndex, val) {
        const preVal = this.parseVal(val);
        const [newCarry, newVal] = this.toBits(preVal);
        const flags = this.example.flags;
        flags.carry = newCarry;
        flags.sign = Boolean(newVal >> (this.bits - 1));
        flags.zero = newVal == 0;
        this.example.stack[toIndex] = newVal;
    }

}

class NegBitAction extends BaseAction {

    constructor(example, options) {
        super(example, options);
        this.bits = options.bits || 8;
    }

    execute(toIndex) {
        const stack = this.example.stack;
        const valueInStack = stack[toIndex];
        this.BOOMSegmentation(valueInStack);
        const val = this.parseVal(valueInStack);
        if (isNaN(val)) {
            stack[toIndex] = '???';
            return;
        }
        const max = (1 << this.bits) - 1;
        flags.sign = Boolean(newVal >> (this.bits - 1));
        flags.zero = newVal == 0;
        stack[toIndex] = (val & max) ^ max;
    }

}

class AddBitAction extends BitAction {

    constructor(example, options) {
        super(example, options);
        this.op = '+';
    }

}

class AdcBitAction extends AddBitAction {

    toBits(val) {
        const max = 1 << this.bits;
        val += this.example.flags.carry ? 1 : 0;
        const carry = Boolean(val & max);
        const newVal = val & (max - 1);
        return [carry, newVal];
    }

}


class SubBitAction extends AddBitAction {

    parseTwoVals(toIndex, val) {
        const max = (1 << this.bits) - 1;
        const [a, b] = super.parseTwoVals(toIndex, val);
        return [a, (b ^ max) + 1];
    }

}

const SIMPLE_ACTIONS = {
    set: SetAction,
    add: BinOpAction.mixin('+'),
    sub: BinOpAction.mixin('-'),
    mul: BinOpAction.mixin('*'),
    div: BinOpAction.mixin('/'),
    'if!': IfAction.mixin('!='),
    'if=': IfAction.mixin('=='),
    'if<': IfAction.mixin('<'),
    'if>': IfAction.mixin('>'),
    'if<=': IfAction.mixin('<='),
    'if>=': IfAction.mixin('>='),
    jmp: JmpAction,
    rjmp: RelJmpAction,
    nop: NopAction,
};

const BIT_ACTIONS = {
    set: SetBitAction,
    add: AddBitAction,
    adc: AdcBitAction,
    sub: SubBitAction,
    or: BitAction.mixin('|'),
    and: BitAction.mixin('&'),
    xor: BitAction.mixin('^'),
    neg: NegBitAction,
};

export default function getAction(actionName, example) {
    const bitActionMatch = actionName.match(/^(\w+)(\d+)$/);
    if (bitActionMatch) {
        const [,bitActionName, bits] = bitActionMatch;
        const bitCls = BIT_ACTIONS[bitActionName];
        if (!bitCls) return null;
        return bitCls.create(example, { bits });
    }

    const cls = SIMPLE_ACTIONS[actionName];
    if (!cls) return null;
    return cls.create(example);
}


