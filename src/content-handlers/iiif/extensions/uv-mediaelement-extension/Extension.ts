import { IIIFEvents } from "../../IIIFEvents";
import { BaseExtension } from "../../modules/uv-shared-module/BaseExtension";
import { Bookmark } from "../../modules/uv-shared-module/Bookmark";
import { DownloadDialogue } from "./DownloadDialogue";
import { MediaElementExtensionEvents } from "./Events";
import { FooterPanel } from "../../modules/uv-shared-module/FooterPanel";
import { HeaderPanel } from "../../modules/uv-shared-module/HeaderPanel";
import { HelpDialogue } from "../../modules/uv-dialogues-module/HelpDialogue";
import { IMediaElementExtension } from "./IMediaElementExtension";
import { MediaElementCenterPanel } from "../../modules/uv-mediaelementcenterpanel-module/MediaElementCenterPanel";
import { MoreInfoRightPanel } from "../../modules/uv-moreinforightpanel-module/MoreInfoRightPanel";
//import { ResourcesLeftPanel } from "../../modules/uv-resourcesleftpanel-module/ResourcesLeftPanel";
import { SettingsDialogue } from "./SettingsDialogue";
import { ShareDialogue } from "./ShareDialogue";
import { Bools, Strings } from "@edsilv/utils";
import { ContentLeftPanel } from "../../modules/uv-contentleftpanel-module/ContentLeftPanel";
import {
  ExternalResourceType,
  MediaType,
} from "@iiif/vocabulary/dist-commonjs/";
import {
  LanguageMap,
  Thumb,
  Canvas,
  Annotation,
  AnnotationBody,
} from "manifesto.js";
import { TFragment } from "../../modules/uv-shared-module/TFragment";
import "./theme/theme.less";
import defaultConfig from "./config/en-CA.json";
import { Events } from "../../../../Events";
import { renderIcon } from "../../../iiif/modules/uv-mediaelementcenterpanel-module/icon-library";
export default class Extension extends BaseExtension
  implements IMediaElementExtension {
  $downloadDialogue: JQuery;
  $shareDialogue: JQuery;
  $helpDialogue: JQuery;
  $settingsDialogue: JQuery;
  centerPanel: MediaElementCenterPanel;
  downloadDialogue: DownloadDialogue;
  shareDialogue: ShareDialogue;
  footerPanel: FooterPanel;
  headerPanel: HeaderPanel;
  helpDialogue: HelpDialogue;
  //leftPanel: ResourcesLeftPanel;
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

    console.log("Extension.mediaElement...............")
    // listen for mediaelement enter/exit fullscreen events.
    $(window).bind("enterfullscreen", () => {
      this.extensionHost.publish(Events.TOGGLE_FULLSCREEN);
    });

    $(window).bind("exitfullscreen", () => {
      this.extensionHost.publish(Events.TOGGLE_FULLSCREEN);
    });

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

    this.extensionHost.subscribe(
      MediaElementExtensionEvents.MEDIA_ENDED,
      () => {
        this.fire(MediaElementExtensionEvents.MEDIA_ENDED);
      }
    );

    this.extensionHost.subscribe(
      MediaElementExtensionEvents.MEDIA_PAUSED,
      () => {
        this.fire(MediaElementExtensionEvents.MEDIA_PAUSED);
      }
    );

    this.extensionHost.subscribe(
      MediaElementExtensionEvents.MEDIA_PLAYED,
      () => {
        this.fire(MediaElementExtensionEvents.MEDIA_PLAYED);
      }
    );
    this.extensionHost.subscribe(
      MediaElementExtensionEvents.MEDIA_FORWARD,
      () => {
        this.fire(MediaElementExtensionEvents.MEDIA_FORWARD);
      }
    );
    this.extensionHost.subscribe(
      MediaElementExtensionEvents.MEDIA_BACKWARD,
      () => {
        this.fire(MediaElementExtensionEvents.MEDIA_BACKWARD);
      }
    );

    this.extensionHost.subscribe(
      MediaElementExtensionEvents.MEDIA_TIME_UPDATE,
      (t: number) => {
        const canvas: Canvas = this.helper.getCurrentCanvas();
        if (canvas) {
          this.data.target = canvas.id + "#" + `t=${t}`;
          this.fire(IIIFEvents.TARGET_CHANGE, this.data.target);
        }
      }
    );
  }

  createModules(): void {
    super.createModules();

    if (this.isHeaderPanelEnabled()) {
      this.headerPanel = new HeaderPanel(this.shell.$headerPanel);
    } else {
      this.shell.$headerPanel.hide();
    }

    if (this.isLeftPanelEnabled()) {
      this.leftPanel = new ContentLeftPanel(this.shell.$leftPanel);
    } else {
      this.shell.$leftPanel.hide();
    }

    this.centerPanel = new MediaElementCenterPanel(this.shell.$centerPanel);

    if (this.isRightPanelEnabled()) {
      this.rightPanel = new MoreInfoRightPanel(this.shell.$rightPanel);
    }


    if (this.isFooterPanelEnabled()) {
      this.footerPanel = new FooterPanel(this.shell.$footerPanel);
    } else {
      this.shell.$footerPanel.hide();
    }

    this.$helpDialogue = $(
      '<div class="overlay help" aria-hidden="true"></div>'
    );
    this.shell.$overlays.append(this.$helpDialogue);
    this.helpDialogue = new HelpDialogue(this.$helpDialogue);

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

    if (this.isLeftPanelEnabled()) {
      this.leftPanel.init();
    }

    if (this.isRightPanelEnabled()) {
      this.rightPanel.init();
    }

    if (this.isFooterPanelEnabled()) {
      this.footerPanel.init();
    }
  }

  render(): void {
    super.render();
    console.log(this.locales);
    console.log(this);
    this.checkForTarget();
    //added by Albert Opena
    //Hide options mimiseButton footer 
    let footerOption = document.getElementsByClassName('options minimiseButtons');
    for (let i = 0; i < footerOption.length; i++) {
      footerOption[i].setAttribute('style', 'display:none');
    }
    // ****** end Here
    this.ForwardRewindEvent();
  }


  ForwardRewindEvent() {
    let ctr = 0;
    const intervalId = setInterval(() => {
      ctr++;
      if (ctr >= 50) {
        clearInterval(intervalId);
      }
      let videoCtrl = document.getElementsByClassName('mejs__inner');
      if (videoCtrl.length > 0) {
        console.log(videoCtrl[0]);
        this.addRewindForwardBtn(videoCtrl);
        clearInterval(intervalId);
      }
    }, 500);
  }
  addRewindForwardBtn(videoCtrl: any) {
    let ctrl1 = document.getElementsByClassName('mejs__controls');
    ctrl1[0].setAttribute('style', 'height:80px')

    const ctrl2 = document.getElementById('mejs_Controls2')
    let videoWidth = "100%";
    if (ctrl2 == null) {
      const videoPlayer = document.getElementById('content');
      if (videoPlayer != null) {
        videoWidth = videoPlayer.style.width;
      }
      let playBtn = document.getElementsByClassName('mejs__button mejs__playpause-button mejs__play')[0];
      if (playBtn != null) {
        let btnPlay = playBtn.getElementsByTagName('button');
        if (btnPlay != null) {
          btnPlay[0].setAttribute('style', 'margin-top:0px;margin-bottom:0px');
        }
      }

      let control2 = document.createElement('div');
      control2.setAttribute('id', 'mejs_Controls2')
      control2.setAttribute('class', 'mejs__controls');
      control2.setAttribute('style', 'bottom:8px;width:' + videoWidth + 'px');

      let rw = document.createElement('div');
      rw.setAttribute('id', 'video_control2');
      if (document.fullscreenElement != null) {
        rw.setAttribute('style', 'width:100%; display:flex;margin-left:47%;');
      } else {
        rw.setAttribute('style', 'width:100%; display:flex;margin-left:41%;');
      }

      //Forward button
      const currentLanguage = this.getLocale().toLowerCase();
      console.log(currentLanguage);
      let ForwardTitle = 'Forward';
      let BackwardTitle = 'Backward';
      if (currentLanguage == 'en-fr'){
        ForwardTitle = 'Avancer';
        BackwardTitle = 'Reculer';
      }

      let forwardBtn = document.createElement('button');
      forwardBtn.setAttribute('id', 'videoForward');
      forwardBtn.setAttribute('class', 'iconplayer');      
      forwardBtn.setAttribute('style', 'margin-top:0px; border:none;background:none;');
      forwardBtn.setAttribute('title', ForwardTitle);
      forwardBtn.setAttribute('aria-label', ForwardTitle);
      
      let frwIcon = document.createElement('span');
      frwIcon.innerHTML = `${renderIcon("fas", "forward")} ` + " <br/>15 sec";
      forwardBtn.appendChild(frwIcon);

      //Backward button
      let backwardBtn = document.createElement('button');
      backwardBtn.setAttribute('id', 'videoBackward');
      backwardBtn.setAttribute('class', 'iconplayer');
      backwardBtn.setAttribute('style', 'margin-top:0px; border:none;background:none;');
      backwardBtn.setAttribute('title', BackwardTitle);
      forwardBtn.setAttribute('aria-label', BackwardTitle);
      let backIcon = document.createElement('span');
      backIcon.innerHTML = `${renderIcon("fas", "backward")} ` + " <br/>15 sec";
      backwardBtn.appendChild(backIcon);

      rw.appendChild(backwardBtn);
      rw.appendChild(playBtn);
      rw.appendChild(forwardBtn);

      control2.appendChild(rw);
      videoCtrl[0].appendChild(control2);
      setTimeout(() => {
        var videoForward = document.getElementById('videoForward');
        videoForward?.addEventListener('click', this.mediaSkip.bind(this, 'forward'));

        var videoBackward = document.getElementById('videoBackward');
        videoBackward?.addEventListener('click', this.mediaSkip.bind(this,'backward'));
      }, 200);
    }
  }
  mediaSkip(skipDirection: string) {
    console.log(skipDirection);
    let videoPlayer = document.getElementsByTagName('audio')[0];
    if (!videoPlayer) {
      videoPlayer = document.getElementsByTagName('video')[0];
    }
    if (skipDirection == "forward") {
      videoPlayer.currentTime = videoPlayer.currentTime + 15;
    }
    else {
      videoPlayer.currentTime = videoPlayer.currentTime - 15;
    }
  }


  checkForTarget(): void {
    if (this.data.target) {
      // Split target into canvas id and selector
      const components: string[] = this.data.target.split("#");
      const canvasId: string = components[0];

      // get canvas index of canvas id and trigger CANVAS_INDEX_CHANGE (if different)
      const index: number | null = this.helper.getCanvasIndexById(canvasId);

      if (index !== null && this.helper.canvasIndex !== index) {
        this.extensionHost.publish(IIIFEvents.CANVAS_INDEX_CHANGE, index);
      }
      // trigger SET_TARGET which calls fitToBounds(xywh) in OpenSeadragonCenterPanel
      const selector: string = components[1];
      this.extensionHost.publish(
        IIIFEvents.SET_TARGET,
        TFragment.fromString(selector)
      );
    }
  }

  isLeftPanelEnabled(): boolean {
    // (this.helper.isMultiCanvas() ||
    //   this.helper.isMultiSequence() ||
    //   this.helper.hasResources());
    return (Bools.getBool(this.data.config.options.leftPanelEnabled, true))


  }

  bookmark(): void {
    super.bookmark();

    const canvas: Canvas = this.extensions.helper.getCurrentCanvas();
    const bookmark: Bookmark = new Bookmark();

    bookmark.index = this.helper.canvasIndex;
    bookmark.label = LanguageMap.getValue(canvas.getLabel());
    bookmark.thumb = canvas.getProperty("thumbnail");
    bookmark.title = this.helper.getLabel();
    bookmark.trackingLabel = window.trackingLabel;

    if (this.isVideo()) {
      bookmark.type = ExternalResourceType.MOVING_IMAGE;
    } else {
      bookmark.type = ExternalResourceType.SOUND;
    }

    this.fire(IIIFEvents.BOOKMARK, bookmark);
  }

  getEmbedScript(template: string, width: number, height: number): string {
    const appUri: string = this.getAppUri();
    let iframeSrc: string = '';
    if (appUri.indexOf('?') > -1) {
      iframeSrc = `${appUri}#&manifest=${this.helper.manifestUri}&c=${this.helper.collectionIndex}&m=${this.helper.manifestIndex}&cv=${this.helper.canvasIndex}`;
    }
    else {
      iframeSrc = `${appUri}#?manifest=${this.helper.manifestUri}&c=${this.helper.collectionIndex}&m=${this.helper.manifestIndex}&cv=${this.helper.canvasIndex}`;
    }

    const script: string = Strings.format(
      template,
      iframeSrc,
      width.toString(),
      height.toString()
    );
    return script;
  }

  // todo: use canvas.getThumbnail()
  getPosterImageUri(): string {
    const canvas: Canvas = this.helper.getCurrentCanvas();
    const annotations: Annotation[] = canvas.getContent();

    if (annotations && annotations.length) {
      return annotations[0].getProperty("thumbnail");
    } else {
      return canvas.getProperty("thumbnail");
    }
  }

  isVideoFormat(type: string): boolean {
    const videoFormats: string[] = [MediaType.VIDEO_MP4, MediaType.WEBM];
    return videoFormats.indexOf(type) != -1;
  }

  isVideo(): boolean {
    const canvas: Canvas = this.helper.getCurrentCanvas();
    const annotations: Annotation[] = canvas.getContent();

    if (annotations && annotations.length) {
      const formats: AnnotationBody[] | null = this.getMediaFormats(canvas);

      for (let i = 0; i < formats.length; i++) {
        const format: AnnotationBody = formats[i];
        const type: MediaType | null = format.getFormat();

        if (type) {
          if (this.isVideoFormat(type.toString())) {
            return true;
          }
        }
      }

      return false;
    } else {
      const type: ExternalResourceType | null = canvas.getType();

      if (type) {
        return type.toString() === ExternalResourceType.MOVING_IMAGE;
      }
    }

    throw new Error("Unable to determine media type");
  }
}
