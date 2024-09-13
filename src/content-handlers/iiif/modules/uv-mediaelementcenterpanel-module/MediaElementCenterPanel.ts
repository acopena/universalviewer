import { Dimensions } from "@edsilv/utils";
const uvj$ = require("jquery");
import { IIIFEvents } from "../../IIIFEvents";
import { MediaElementExtensionEvents } from "../../extensions/uv-mediaelement-extension/Events";
import { CenterPanel } from "../uv-shared-module/CenterPanel";
import { IMediaElementExtension } from "../../extensions/uv-mediaelement-extension/IMediaElementExtension";
import { sanitize } from "../../../../Utils";
import { MediaType } from "@iiif/vocabulary/dist-commonjs/";
import {
  AnnotationBody,
  Canvas,
  IExternalResource,
  Rendering,
} from "manifesto.js";
import "mediaelement/build/mediaelement-and-player";
import "mediaelement-plugins/dist/source-chooser/source-chooser";
import "mediaelement-plugins/dist/source-chooser/source-chooser.css";
import { TFragment } from "../uv-shared-module/TFragment";
import { Events } from "../../../../Events";

//import Hls from 'hls.js';
export class MediaElementCenterPanel extends CenterPanel {
  $wrapper: JQuery;
  $container: JQuery;
  $media: JQuery;
  mediaHeight: number;
  mediaWidth: number;
  player: any;
  title: string | null;

  constructor($element: JQuery) {
    super($element);
  }

  create(): void {
    this.setConfig("mediaelementCenterPanel");

    super.create();

    const that = this;

    this.extensionHost.subscribe(Events.TOGGLE_FULLSCREEN, () => {
      this.resize();
    });

    this.extensionHost.subscribe(IIIFEvents.SET_TARGET, (target: TFragment) => {
      let t = target.t;
      if (Array.isArray(t)) {
        t = t[0];
      }
      that.player.setCurrentTime(t);
      that.player.play();
    });


    this.extensionHost.subscribe(
      IIIFEvents.OPEN_EXTERNAL_RESOURCE,
      (resources: IExternalResource[]) => {
        that.openMedia(resources);
      }
    );

    this.$wrapper = uvj$('<div class="wrapper"></div>');
    this.$content.append(this.$wrapper);

    this.$container = uvj$('<div class="container"></div>');
    this.$wrapper.append(this.$container);

    this.title = this.extension.helper.getLabel();
  }


  async openMedia(resources: IExternalResource[]) {
    const that = this;
    await this.extension.getExternalResources(resources);
    this.$container.empty();

    const canvas: Canvas = this.extension.helper.getCurrentCanvas();
    this.mediaHeight = this.config.defaultHeight;
    this.mediaWidth = this.config.defaultWidth;

    const poster: string = (<IMediaElementExtension>(
      this.extension
    )).getPosterImageUri();
    const sources: any[] = [];
    const subtitles: Array<{
      language?: string;
      label?: string;
      id: string;
    }> = [];

    const renderings: Rendering[] = canvas.getRenderings();

    if (renderings && renderings.length) {
      canvas.getRenderings().forEach((rendering: Rendering) => {

        sources.push({
          type: rendering.getFormat().toString(),
          src: rendering.id,
        });
      });

    } else {
      const formats: AnnotationBody[] | null = this.extension.getMediaFormats(
        this.extension.helper.getCurrentCanvas()
      );

      
      if (formats && formats.length) {
        formats.forEach((format: AnnotationBody) => {
          const type: MediaType | null = format.getFormat();
          if (type && type.toString() === "text/vtt") {
            subtitles.push(format.__jsonld);
          } else if (type) {
            sources.push({
              label: format.__jsonld.label ? format.__jsonld.label : "",
              type: type.toString(),
              src: format.id,
            });
          }
        });
      }
    }

    if (this.isVideo()) {
      this.$media = uvj$(
        '<video controls="controls" preload="none" style="width:100%;height:100%;" width="100%" height="100%"></video>@'
      );

      // Add VTT subtitles/captions.
      for (const subtitle of subtitles) {
        this.$media.append(
          $(`<track label="${subtitle.label}" kind="subtitles" srclang="${subtitle.language
            }" src="${subtitle.id}" ${subtitles.indexOf(subtitle) === 0 ? "default" : ""
            }>`)
        );
      }

      for (const source of sources) {
        //Added by Albert Opena
        //This will get the actual url playlist from Central
        await this.getVideoUrlFromCentral(source.src).then((data) => {
          if (data == undefined) {
            source.src = this.getM3U8url(source.src); 
          }
          else {
            source.src = data;
          }
        })        
        .catch( (error) => {
          console.log('errror encountered');
          console.log(error);
           source.src = this.getM3U8url(source.src);
        })
        //***** End  */

        this.$media.append(
          $(
            `<source src="${source.src}" "type="${source.type}"" title="${source.label}">`
          )
        );
      }

      this.$container.append(this.$media);
      this.player = new MediaElementPlayer($("video")[0], {
        poster: poster,
        toggleCaptionsButtonWhenOnlyOne: true,
        features: [
          "playpause",
          "current",
          "progress",
          "tracks",
          "volume",
          "sourcechooser",
          "fullscreen",
          "backward",
          "forward"
        ],
        success: function (mediaElement: any, originalNode: any) {
          mediaElement.addEventListener("loadstart", () => {
            // console.log("loadstart");
            that.resize();
          });

          mediaElement.addEventListener("play", () => {
            that.extensionHost.publish(
              MediaElementExtensionEvents.MEDIA_PLAYED,
              Math.floor(mediaElement.currentTime)
            );
          });

          mediaElement.addEventListener("pause", () => {
            // mediaelement creates a pause event before the ended event. ignore this.
            if (
              Math.floor(mediaElement.currentTime) !=
              Math.floor(mediaElement.duration)
            ) {
              that.extensionHost.publish(
                MediaElementExtensionEvents.MEDIA_PAUSED,
                Math.floor(mediaElement.currentTime)
              );
            }
          });

          mediaElement.addEventListener("ended", () => {
            that.extensionHost.publish(
              MediaElementExtensionEvents.MEDIA_ENDED,
              Math.floor(mediaElement.duration)
            );
          });

          mediaElement.addEventListener("timeupdate", () => {
            that.extensionHost.publish(
              MediaElementExtensionEvents.MEDIA_TIME_UPDATE,
              Math.floor(mediaElement.currentTime)
            );
          });

          mediaElement.addEventListener("backward", () => {
            that.extensionHost.publish(
              MediaElementExtensionEvents.MEDIA_BACKWARD,
              Math.floor(mediaElement.backward)
            );
          });

          mediaElement.addEventListener("forward", () => {
            that.extensionHost.publish(
              MediaElementExtensionEvents.MEDIA_FORWARD,
              Math.floor(mediaElement.forward)
            );
          });
        },
      });
    } else {
      // audio

      console.log('********* Audio part *********')
      this.$media = uvj$(
        '<audio controls="controls" preload="none" style="width:100%;height:100%;" width="100%" height="100%"></audio>'
      );

      for (const source of sources) {
         //Added by Albert Opena
        //This will get the actual url playlist from Central
        await this.getVideoUrlFromCentral(source.src).then((data) => {
          if (data == undefined) {
            source.src = this.getM3U8url(source.src);           
          }
          else {           
            source.src = data;
          }          
        })   
        .catch( (error) => {        
           source.src = this.getM3U8url(source.src);
        })
        //***** End  */
        this.$media.append(
          uvj$(
            `<source src="${source.src}" type="${source.type}" title="${source.label}">`
          )
        );
      }

      this.$container.append(this.$media);

      this.player = new MediaElementPlayer($("audio")[0], {
        poster: poster,
        defaultAudioWidth: "auto",
        features: [
          "playpause",
          "current",
          "progress",
          "tracks",
          "volume",
          "sourcechooser",
          "forward",
          "backward"
        ],
        stretching: "responsive",
        defaultAudioHeight: "auto",
        showPosterWhenPaused: true,
        showPosterWhenEnded: true,
        success: function (mediaElement: any, originalNode: any) {
          mediaElement.addEventListener("play", () => {
            that.extensionHost.publish(
              MediaElementExtensionEvents.MEDIA_PLAYED,
              Math.floor(mediaElement.currentTime)
            );
          });

          mediaElement.addEventListener("pause", () => {
            // mediaelement creates a pause event before the ended event. ignore this.
            if (
              Math.floor(mediaElement.currentTime) !=
              Math.floor(mediaElement.duration)
            ) {
              that.extensionHost.publish(
                MediaElementExtensionEvents.MEDIA_PAUSED,
                Math.floor(mediaElement.currentTime)
              );
            }
          });

          mediaElement.addEventListener("ended", () => {
            that.extensionHost.publish(
              MediaElementExtensionEvents.MEDIA_ENDED,
              Math.floor(mediaElement.duration)
            );
          });

          mediaElement.addEventListener("timeupdate", () => {
            that.extensionHost.publish(
              MediaElementExtensionEvents.MEDIA_TIME_UPDATE,
              Math.floor(mediaElement.currentTime)
            );
          });
          mediaElement.addEventListener("backward", () => {
            that.extensionHost.publish(
              MediaElementExtensionEvents.MEDIA_BACKWARD,
              Math.floor(mediaElement.currentTime)
            );
          });
          mediaElement.addEventListener("forward", () => {
            that.extensionHost.publish(
              MediaElementExtensionEvents.MEDIA_FORWARD,
              Math.floor(mediaElement.currentTime)
            );
          });
        },
      });
    }

    this.extensionHost.publish(Events.EXTERNAL_RESOURCE_OPENED);
    this.extensionHost.publish(Events.LOAD);
  }



  getM3U8url(bodyId: string) {
    let m3u8Url = bodyId;    
    let urlBody = new URL(bodyId.toLocaleLowerCase());
    const idx: string | null = urlBody.searchParams.get('id');    
    if (idx && idx.length >= 30) {
      m3u8Url = "https://d34nlrv9tbrf93.cloudfront.net/" + idx + "/playlist.m3u8";
    }
    return m3u8Url;
  }

  async getVideoUrlFromCentral(urlId: string) {
    let result;
    try {
      result = await $.ajax({
        url: urlId,
        type: 'GET',
      });
      return result;
    }
    catch (error) {
      console.log(error)
      return result;
    }

  }

  isVideo(): boolean {
    return (<IMediaElementExtension>this.extension).isVideo();
  }

  resize() {
    super.resize();

    if (!this.mediaWidth || !this.mediaHeight) {
      return;
    }

    if (this.title) {
      this.$title.text(sanitize(this.title));
    }

    const size = Dimensions.fitRect(this.mediaWidth, this.mediaHeight, this.$content.width(), this.$content.height());

    this.$container.height(size.height);
    this.$container.width(size.width);

    if (this.player) {
      this.$media.width(size.width);
      this.$media.height(size.height);
    }

    if (this.player) {
      if (size.width > 0 && size.height > 0) {
        this.player.setPlayerSize(size.width, size.height);
        this.player.setControlsSize();
      }
    }
  }
}
