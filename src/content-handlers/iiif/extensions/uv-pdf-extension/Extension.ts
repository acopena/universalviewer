import { IIIFEvents } from "../../IIIFEvents";
import { BaseExtension } from "../../modules/uv-shared-module/BaseExtension";
import { Bookmark } from "../../modules/uv-shared-module/Bookmark";
import { DownloadDialogue } from "./DownloadDialogue";

import { FooterPanel } from "../../modules/uv-shared-module/FooterPanel";

import { IPDFExtension } from "./IPDFExtension";
import { MoreInfoRightPanel } from "../../modules/uv-moreinforightpanel-module/MoreInfoRightPanel";
import { PDFCenterPanel } from "../../modules/uv-pdfcenterpanel-module/PDFCenterPanel";

import { PDFHeaderPanel } from "../../modules/uv-pdfheaderpanel-module/PDFHeaderPanel";

import { ContentLeftPanel } from "../../modules/uv-contentleftpanel-module/ContentLeftPanel";
//import { PagingHeaderPanel } from "../../modules/uv-pagingheaderpanel-module/PagingHeaderPanel";
// import { ResourcesLeftPanel } from "../../modules/uv-resourcesleftpanel-module/ResourcesLeftPanel";
import { SettingsDialogue } from "./SettingsDialogue";
import { ShareDialogue } from "./ShareDialogue";
import { ExternalResourceType } from "@iiif/vocabulary/dist-commonjs/";
import { Bools, Strings } from "@edsilv/utils";
import { Canvas, LanguageMap, Thumb } from "manifesto.js";
import "./theme/theme.less";
import defaultConfig from "./config/en-CA.json";
import { Events } from "../../../../Events";


export default class Extension extends BaseExtension implements IPDFExtension {
  $downloadDialogue: JQuery;
  $shareDialogue: JQuery;
  $helpDialogue: JQuery;
  $settingsDialogue: JQuery;
  $pagingFooter: JQuery;

  centerPanel: PDFCenterPanel;
  downloadDialogue: DownloadDialogue;
  shareDialogue: ShareDialogue;

  footerPanel: FooterPanel;
 // headerPanel: PagingHeaderPanel;
 // pagingPanel: PagingHeaderPanel;
  
  headerPanel: PDFHeaderPanel;
  leftPanel: ContentLeftPanel;
  rightPanel: MoreInfoRightPanel;
  settingsDialogue: SettingsDialogue;
  defaultConfig: any = defaultConfig;
  locales = {
    "en-CA": defaultConfig,
    "fr-CA": () => import("./config/fr-CA.json")
  };

  create(): void {
    super.create();
    console.log('**** uv pdf extention ****');   
    
    this.extensionHost.subscribe(
      IIIFEvents.CANVAS_INDEX_CHANGE,
      (canvasIndex: number) => {
        this.viewCanvas(canvasIndex);
      }
    );

    this.extensionHost.subscribe(IIIFEvents.THUMB_SELECTED, (thumb: Thumb) => {
      this.extensionHost.publish(IIIFEvents.CANVAS_INDEX_CHANGE, thumb.index);
    });

    this.extensionHost.subscribe(IIIFEvents.LEFTPANEL_EXPAND_FULL_START, () => {
      this.shell.$centerPanel.hide();
      this.shell.$rightPanel.hide();
    });

    this.extensionHost.subscribe(
      IIIFEvents.LEFTPANEL_COLLAPSE_FULL_FINISH,
      () => {
        this.shell.$centerPanel.show();
        this.shell.$rightPanel.show();
        this.resize();
      }
    );

    this.extensionHost.subscribe(Events.EXIT_FULLSCREEN, () => {
      setTimeout(() => {
        this.resize();
      }, 10); // allow time to exit full screen, then resize
    });
  }

  render(): void {
    super.render();
  }

  isHeaderPanelEnabled(): boolean {
    return (
      super.isHeaderPanelEnabled() &&
      Bools.getBool(this.data.config.options.usePdfJs, true)
    );
  }

  createModules(): void {
    super.createModules();    
    if (this.isHeaderPanelEnabled()) {
      this.headerPanel = new PDFHeaderPanel(this.shell.$headerPanel);
    } else {
      this.shell.$headerPanel.hide();
    }

    
    if (this.isLeftPanelEnabled()) {
      this.leftPanel = new ContentLeftPanel(this.shell.$leftPanel);
    } else {
      this.shell.$leftPanel.hide();
    }

    // if (this.isLeftPanelEnabled()) {
    //   this.leftPanel = new ResourcesLeftPanel(this.shell.$leftPanel);
    // }

    this.centerPanel = new PDFCenterPanel(this.shell.$centerPanel);

    if (this.isRightPanelEnabled()) {
      this.rightPanel = new MoreInfoRightPanel(this.shell.$rightPanel);
    }   
  
    if (this.isFooterPanelEnabled()) {
      this.footerPanel = new FooterPanel(this.shell.$footerPanel);
      console.log(this.footerPanel);
      
    } else {
      this.shell.$footerPanel.hide();
    }

    this.$downloadDialogue = $(
      '<div class="overlay download" aria-hidden="true"></div>'
    );
    this.shell.$overlays.append(this.$downloadDialogue);
    this.downloadDialogue = new DownloadDialogue(this.$downloadDialogue);

    this.$shareDialogue = $(
      '<div class="overlay share" aria-hidden="true"></div>'
    );
    this.shell.$overlays.append(this.$shareDialogue);
    this.shareDialogue = new ShareDialogue(this.$shareDialogue);

    this.$settingsDialogue = $(
      '<div class="overlay settings" aria-hidden="true"></div>'
    );
    this.shell.$overlays.append(this.$settingsDialogue);
    this.settingsDialogue = new SettingsDialogue(this.$settingsDialogue);

   // this.pagingPanel = new PagingHeaderPanel(this.shell.$footerPanel);
    if (this.isLeftPanelEnabled()) {
      this.leftPanel.init();
    }

    if (this.isRightPanelEnabled()) {
      this.rightPanel.init();
    }
    // if (this.isFooterPanelEnabled()) {
    //   this.footerPanel.init();
    // }
  }

  bookmark(): void {
    super.bookmark();

    const canvas: Canvas = this.helper.getCurrentCanvas();
    const bookmark: Bookmark = new Bookmark();

    bookmark.index = this.helper.canvasIndex;
    bookmark.label = <string>LanguageMap.getValue(canvas.getLabel());
    bookmark.thumb = canvas.getProperty("thumbnail");
    bookmark.title = this.helper.getLabel();
    bookmark.trackingLabel = window.trackingLabel;
    bookmark.type = ExternalResourceType.DOCUMENT;

    this.fire(IIIFEvents.BOOKMARK, bookmark);
  }

  dependencyLoaded(index: number, dep: any): void {
    if (index === 0) {
      window.PDFObject = dep;
    }
  }

  getEmbedScript(template: string, width: number, height: number): string {
    const appUri: string = this.getAppUri();    
    let iframeSrc: string = `${appUri}#?manifest=${this.helper.manifestUri}&c=${this.helper.collectionIndex}&m=${this.helper.manifestIndex}&cv=${this.helper.canvasIndex}`;
    if (appUri.indexOf('?') > -1) {
      iframeSrc = `${appUri}#&manifest=${this.helper.manifestUri}&c=${this.helper.collectionIndex}&m=${this.helper.manifestIndex}&cv=${this.helper.canvasIndex}`;
    }
    const script: string = Strings.format(
      template,
      iframeSrc,
      width.toString(),
      height.toString()
    );
    return script;
  }
}
