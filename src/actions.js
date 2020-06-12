class BaseAction {
    constructor(example) {
        this.example = example;
    }

    static create(example) {
        return new this(example);
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

    constructor(op, example) {
        super(example);
        this.op = op;
    }

    static mixin(op) {
        const cls = this;
        return {
            create(example) { return new cls(op, example); }
        };
    }

}


class BinOpAction extends OpAction {

    execute(toIndex, val) {
        const stack = this.example.stack;
        const valueInStack = stack[toIndex];
        this.BOOMSegmentation(valueInStack);
        const a = this.parseVal(valueInStack);
        const b = this.parseVal(val);
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


export default {
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
