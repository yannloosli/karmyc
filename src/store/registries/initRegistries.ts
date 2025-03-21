import { areaRegistry } from "../../area/registry";
import { FlowEditor } from "../../components/FlowEditor";
import { History } from "../../components/history-panel/History";
import { Project } from "../../components/project/Project";
import { Timeline } from "../../components/Timeline";
import { Workspace } from "../../components/Workspace";
import { AreaType } from "../../constants/index";

export function initAreaRegistries() {
    // Enregistrer les composants pour chaque type d'area dans le registre unique
    areaRegistry.registerComponent(AreaType.Project, Project);
    areaRegistry.registerComponent(AreaType.Timeline, Timeline);
    areaRegistry.registerComponent(AreaType.Workspace, Workspace);
    areaRegistry.registerComponent(AreaType.FlowEditor, FlowEditor);
    areaRegistry.registerComponent(AreaType.History, History);
} 
