import Example from "@/example";
import CodeComponent from "@/components/code"
import StackComponent from "@/components/stack"
import FlagsComponent from "@/components/flags"

function byId (id) {
    return document.getElementById(id);
}

window.Example = Example;
window.byId = byId;
window.CodeComponent = CodeComponent;
window.StackComponent = StackComponent;
window.FlagsComponent = FlagsComponent;
window.CpuFlags = ['carry', 'sign', 'zero'];
