export default class Parser {

    constructor(example) {
        this.example = example;
        this.rules = [
            { rule: /\$([\w_]+)/g, cb: this.parseVariable },
            { rule: /(&+\d+)/g, cb: this.parsePointer },
            { rule: /(\d+)([+-])(\d+)/g, cb: this.parseOffset },
            { rule: /(\^+\d+)/g, cb: this.parseNestedPointer },
        ]
    }

    parse(action) {
        const rawArgs = action.trim().split(/ +/);
        const actionName = rawArgs[0].toLowerCase();
        const args = parseArgs(rawArgs);
        return [actionName, args];
    }

    parseArgs(rawArgs) {
        return rawArgs.splice(1).map(arg => {
            this.rules.reduce(this.parseArgsReduce, arg)
        });
    }

    parseArgsReduce(arg, { rule, cb }) {
        const _this = this;

        function innerCb() {
            let ruleArgs = [this.example];
            for(let i = 1; i < arguments.lenght; i++) {
                ruleArgs.push(arguments[i]);
            }
            cb.bind(_this).call(ruleArgs);
        }

        return arg.replace(rule, innerCb);
    }

    BOOM(msg) {
        this.example.boom(msg);
    }

    pointerFromStack(val) {
        var deep = val.match(/&/g).length;
        val = val.substr(deep);
        for(var i=0; i < deep; i++) {
            var index = parseInt(val);
            if (isNaN(index)) boom("wrong value in pointer:" + index);
            val = stack[index];
            if (val === undefined) this.BOOM("segmentation fault");
        }
        return this.example.options.parseVal(val);
    }

    parseVariable({step, options, boom}, labelName) {
        if (labelName === '_STEP') {
            return (step + 1).toString();
        }
        const label = options.stackLabels[labelName];
        const index = typeof label === 'number' ? label : label.index;
        if (index === undefined) this.BOOM("unknown label:" + labelName);
        return index.toString();
    }

    parsePointer(_, val) {
        return this.pointerFromStack(val).toString();
    }

    parseNestedPointer(_, val) {
        return this.pointerFromStack(val.replace(/\^/g, '&')).toString();
    }

    parseOffset({ boom }, indexRaw, sign, offsetRaw) {
        const index = parseInt(indexRaw);
        let offset = parseInt(offsetRaw);
        if (sign === '-') offset = -offset;
        if (isNaN(index)) this.BOOM("wrong value in offset:" + index);
        if (isNaN(offset)) this.BOOM("wrong offset in offset:" + offset);
        return (index + offset).toString();
    }

}
