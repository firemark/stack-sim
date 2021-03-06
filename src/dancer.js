import Parser from "@/parser";
import getAction from "@/actions";

export default class Dancer {

    constructor(example) {
        this.example = example;
        this.parser = new Parser(example);
    }

    dance() {
        const line = this.getLine();
        const actions = this.splitActions(line);

        this.example.nextStep = this.example.step + 1;
        actions.forEach(rawAction => {
            const [actionName, rawArgs] = this.parser.parse(rawAction);
            const action = getAction(actionName, this.example);

            if (!action) {
                console.warn('undefined action:', actionName);
                return;
            }

            action.execute.apply(action, rawArgs);
        });
    }

    getLine() {
        return this.example.code[this.example.step];
    }

    splitActions(line) {
        let actions = line.action.split(';');
        if (line.firstAction && !line.firstExecuted) {
            line.firstExecuted = true;
            actions = line.firstAction.split(';').concat(actions);
        }
        return actions;
    }
}
