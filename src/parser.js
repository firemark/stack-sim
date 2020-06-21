import { FLOAT_STANDARDS, FloatObj } from "@/float";


export default class Parser {

    constructor(example) {
        this.example = example;
        this.rules = [
            { rule: /(\d+).(\d+)F(\d+)/g, cb: this.parseFloat },
            { rule: /\$([\w_]+)/g, cb: this.parseVariable },
            { rule: /(&+\d+)/g, cb: this.parsePointer },
            { rule: /(\d+)([+-])(\d+)/g, cb: this.parseOffset },
            { rule: /(\^+\d+)/g, cb: this.parseNestedPointer },
        ]
    }

    parse(action) {
        const rawArgs = action.trim().split(/ +/);
        const actionName = rawArgs[0].toLowerCase();
        const args = this.parseArgs(rawArgs);
        return [actionName, args];
    }

    parseArgs(rawArgs) {
        return rawArgs.splice(1).map(arg =>
            this.rules.reduce(
                this.parseArgsReduce.bind(this),
                arg,
            )
        );
    }

    parseArgsReduce(arg, { rule, cb }) {
        const example = this.example;
        const _this = this;

        function innerCb() {
            let ruleArgs = [example];
            for(let i = 1; i < arguments.length - 2; i++) {
                ruleArgs.push(arguments[i]);
            }
            return cb.apply(_this, ruleArgs);
        }

        return arg.replace(rule, innerCb);
    }

    BOOM(msg) {
        this.example.throwBoom(msg);
    }

    pointerFromStack(stack, valRaw) {
        const deep = valRaw.match(/&/g).length;
        let val = valRaw.substr(deep);
        for(let i=0; i < deep; i++) {
            const index = parseInt(val);
            if (isNaN(index)) this.BOOM("wrong value in pointer:" + index);
            val = stack[index];
            if (val === undefined) this.BOOM("segmentation fault");
        }
        return this.example.options.parseVal(val);
    }

    parseFloat(_, a, b, bits) {
        const standard = FLOAT_STANDARDS[bits];

        if (!standard) {
            this.BOOM(`wrong number of bits: ${bits}`);
        }

        const number = parseFloat(`${a}.${b}`);
        return FloatObj.fromFloat(number, standard).toBits();
    }

    parseVariable({step, options}, labelName) {
        if (labelName === '_STEP') {
            return (step + 1).toString();
        }
        const label = options.stackLabels[labelName];
        const index = typeof label === 'number' ? label : label.index;
        if (index === undefined) this.BOOM("unknown label:" + labelName);
        return index.toString();
    }

    parsePointer({ stack }, val) {
        return this.pointerFromStack(stack, val).toString();
    }

    parseNestedPointer({ stack }, val) {
        return this.pointerFromStack(stack, val.replace(/\^/g, '&')).toString();
    }

    parseOffset(_, indexRaw, sign, offsetRaw) {
        const index = parseInt(indexRaw);
        let offset = parseInt(offsetRaw);
        if (sign === '-') offset = -offset;
        if (isNaN(index)) this.BOOM("wrong value in offset:" + index);
        if (isNaN(offset)) this.BOOM("wrong offset in offset:" + offset);
        return (index + offset).toString();
    }

}
