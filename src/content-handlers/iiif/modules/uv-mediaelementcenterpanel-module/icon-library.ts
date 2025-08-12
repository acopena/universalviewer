import { library, IconPrefix, IconName, icon } from '@fortawesome/fontawesome-svg-core';
import {
    faFileAlt as fasFileAlt, faTags as fasTags, faThList as fasThList, faSave as fasSave,
    faAngleDown as fasAngleDown, faAngleLeft as fasAngleLeft, faQuestionCircle as fasQuestionCircle,
    faPlus as fasPlus, faTag as fasTag, faLock as fasLock, faExpand as fasExpand, faCompress as fasCompress, faPrint as fasPrint,
    faSync as fasSync, faDownload as fasDownload, faEdit as fasEdit, faUserCircle as fasUserCircle,
    faLink as fasLink, faForward as fasForward, faBackward as fasBackward, faRedo as fasRedo, faUndo as fasUndo,
    faWindowMaximize as fasWindoMaximize, faExclamation as fasWindoExclamation
} from '@fortawesome/free-solid-svg-icons';


library.add(fasFileAlt, fasTags, fasThList, fasSave, fasAngleDown, fasAngleLeft, fasQuestionCircle,
    fasPlus, fasTag, fasLock, fasExpand, fasCompress, fasPrint, fasSync, fasDownload, fasEdit, fasUserCircle,
    fasLink, fasForward, fasBackward, fasUndo, fasRedo, fasWindoMaximize, fasWindoExclamation);

export function renderIcon(prefix: string, name: string) {
    let instance = icon({ prefix: prefix as IconPrefix, iconName: name as IconName });
    return instance.html[0];
   
}

