import { FlowEditor } from "../../components/FlowEditor";
import { History } from "../../components/history-panel/History";
import { Project } from "../../components/project/Project";
import { Timeline } from "../../components/Timeline";
import { Workspace } from "../../components/Workspace";
import { AreaType } from "../../constants/index";
import { registerAreaComponent } from "./areaRegistry";

export function initAreaRegistries() {
    // Enregistrer les composants pour chaque type d'area
    registerAreaComponent(AreaType.Project, Project);
    registerAreaComponent(AreaType.Timeline, Timeline);
    registerAreaComponent(AreaType.Workspace, Workspace);
    registerAreaComponent(AreaType.FlowEditor, FlowEditor);
    registerAreaComponent(AreaType.History, History);
} 
