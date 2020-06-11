import Parser from "@/parser";
import actions from "@/actions";

export default class Dancer {

    contructor(example) {
        this.example = example;
        this.parser = new Parser(example);
        this.actionClasses = actions;
    }

    dance() {
        const line = this.getLine();
        const actions = this.splitActions(line);

        this.example.nextStep = this.example.step + 1;
        actions.forEach(rawAction => {
            const [actionName, rawArgs] = this.parser.parse(rawAction);
            const actionCls = this.actionClasses[actionName];

            if (!actionCls) {
                console.warn('undefined action:', actionName);
                return;
            }

            const action = new actionCls(this.example);
            action.execute.call(action, rawArgs);
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
