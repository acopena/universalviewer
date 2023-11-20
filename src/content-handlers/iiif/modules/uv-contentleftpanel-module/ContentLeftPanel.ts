const $ = require("jquery");
import { sanitize } from "../../../../Utils";
import { UriLabeller, AnnotationGroup, TreeSortType } from "@iiif/manifold";
import { createElement } from "react";
import { createRoot, Root } from "react-dom/client";
import ThumbsView from "./ThumbsView";
const ViewingDirectionEnum = require("@iiif/vocabulary/dist-commonjs/")
  .ViewingDirection;
const ViewingHintEnum = require("@iiif/vocabulary/dist-commonjs/").ViewingHint;
import { Bools, Urls } from "@edsilv/utils";
import { ViewingHint, ViewingDirection } from "@iiif/vocabulary/dist-commonjs/";
import { IIIFEvents } from "../../IIIFEvents";
import { GalleryView } from "./GalleryView";
import OpenSeadragonExtension from "../../extensions/uv-openseadragon-extension/Extension";
import { LeftPanel } from "../uv-shared-module/LeftPanel";
import { Mode } from "../../extensions/uv-openseadragon-extension/Mode";
import { TreeView } from "./TreeView";
import {
  Thumb,
  TreeNode,
  Range,
} from "manifesto.js";

import { MetadataComponent, LimitType } from "@iiif/iiif-metadata-component";
import { isVisible } from "../../../../Utils";
import { init } from "../../../../Init";


export class ContentLeftPanel extends LeftPanel {  
  metadataComponent: any;
  $metadata: JQuery;

  $bottomOptions: JQuery;
  $galleryView: JQuery;
  $leftOptions: JQuery;
  $options: JQuery;
  $rightOptions: JQuery;
  $sortButtonGroup: JQuery;
  $sortByDateButton: JQuery;
  $sortByLabel: JQuery;
  $sortByVolumeButton: JQuery;
  $tabs: JQuery;
  $tabsContent: JQuery;
  $thumbsButton: JQuery;

  $detailsTabButton: JQuery;
  $downloadButton: JQuery;
  $detailsView: JQuery;

  $thumbsView: JQuery;
  $topOptions: JQuery;
  $treeButton: JQuery;
  $treeView: JQuery;
  $treeViewOptions: JQuery;
  $treeSelect: JQuery;
  $views: JQuery;
  expandFullEnabled: boolean = false;
  galleryView: GalleryView;
  isThumbsViewOpen: boolean = false;
  isTreeViewOpen: boolean = false;
  isDetailsViewOpen: boolean = false;
  treeData: TreeNode;
  treeSortType: TreeSortType = TreeSortType.NONE;
  treeView: TreeView;
  thumbsRoot: Root;

  
  constructor($element: JQuery   ) {
    super($element);  
    
  }

  create(): void {
    this.setConfig("contentLeftPanel");
    super.create();
    //For moreinfo
    this.extensionHost.subscribe(IIIFEvents.CANVAS_INDEX_CHANGE, () => {     
      this.checkTypeData();
      this.databind();     
    });

    this.extensionHost.subscribe(IIIFEvents.RANGE_CHANGE, () => {
      this.databind();
    });
    //*** */
    this.extensionHost.subscribe(IIIFEvents.SETTINGS_CHANGE, () => {
      this.render();
    });

    this.extensionHost.subscribe(IIIFEvents.CANVAS_INDEX_CHANGE, () => {
   
      this.render();     
    });

    this.extensionHost.subscribe(IIIFEvents.GALLERY_THUMB_SELECTED, () => {
      this.collapseFull();
    });

    this.extensionHost.subscribe(IIIFEvents.METRIC_CHANGE, () => {
      if (!this.extension.isDesktopMetric()) {
        if (this.isFullyExpanded) {
          this.collapseFull();
        }
      }
    });

    this.extensionHost.subscribe(IIIFEvents.SETTINGS_CHANGE, () => {
      this.updateDownloadButton();
    });

    this.extensionHost.subscribe(IIIFEvents.ANNOTATIONS, () => {
      this.renderThumbs();
      this.renderGallery();
    });

    this.extensionHost.subscribe(IIIFEvents.ANNOTATIONS_CLEARED, () => {
      this.renderThumbs();
      this.renderGallery();
    });

    this.extensionHost.subscribe(IIIFEvents.ANNOTATIONS_EMPTY, () => {
      this.renderThumbs();
      this.renderGallery();
    });

    this.extensionHost.subscribe(IIIFEvents.CANVAS_INDEX_CHANGE, () => {
      if (this.isFullyExpanded) {
        this.collapseFull();
      }

    });

    this.extensionHost.subscribe(IIIFEvents.RANGE_CHANGE, () => {
      if (this.isFullyExpanded) {
        this.collapseFull();
      }


    });

    // this.extensionHost.subscribe(
    //   OpenSeadragonExtensionEvents.PAGING_TOGGLED,
    //   (_paged: boolean) => {
    //     this.renderThumbs();
    //   }
    // );

    this.$downloadButton = $(`
        <button class="download btn imageBtn" title="${this.content.download}" id="download-btn">
          <i class="uv-icon uv-icon-download" aria-hidden="true"></i>
          <span class="sr-only">${this.content.download}</span>
        </button>
      `);
    this.$main.append(this.$downloadButton);
    this.$tabs = $('<div class="tabs"></div>');
    this.$main.append(this.$tabs);
    // this.$tabs.append(this.$treeButton);


    this.$thumbsButton = $(
      '<a class="thumbs tab on" tabindex="0">' + this.content.thumbnails + "</a>"
    );
    this.$tabs.append(this.$thumbsButton);

    this.$detailsTabButton = $(
      '<a class="details tab" tabindex="0">' + this.content.details + "</a>"
    );
    this.$tabs.append(this.$detailsTabButton);

    this.$tabsContent = $('<div class="tabsContent"></div>');
    this.$main.append(this.$tabsContent);

    this.$options = $('<div class="options"></div>');
    this.$tabsContent.append(this.$options);

    this.$topOptions = $('<div class="top"></div>');
    this.$options.append(this.$topOptions);

    this.$bottomOptions = $('<div class="bottom"></div>');
    this.$options.append(this.$bottomOptions);

    this.$leftOptions = $('<div class="left"></div>');
    this.$bottomOptions.append(this.$leftOptions);

    this.$rightOptions = $('<div class="right"></div>');
    this.$bottomOptions.append(this.$rightOptions);

    this.$views = $('<div class="views"></div>');
    this.$tabsContent.append(this.$views);

    this.$thumbsView = $('<div class="thumbsView" tabindex="-1"></div>');
    this.$views.append(this.$thumbsView);

    this.$galleryView = $('<div class="galleryView"></div>');
    this.$views.append(this.$galleryView);

    this.$detailsView = $(
      '<div class="detailsView"></div>'
    );
    this.$views.append(this.$detailsView);

    this.$metadata = $('<div class="iiif-metadata-component"></div>');
    this.$detailsView.append(this.$metadata);

    this.metadataComponent = new MetadataComponent({
      target: <HTMLElement>this.$metadata[0],
      data: this._getData(),
    });

    this.$downloadButton.onPressed(() => {
      this.extensionHost.publish(
        IIIFEvents.SHOW_DOWNLOAD_DIALOGUE,
        this.$downloadButton
      );
    });
    this.openThumbsView();


    this.onAccessibleClick(this.$thumbsButton, () => {
      this.openThumbsView();
    });
    this.onAccessibleClick(this.$detailsTabButton, () => {
      this.openDetailsView();
    });

    this.setTitle(this.content.title);

    //this.$sortByVolumeButton.addClass("on");

    var tabOrderConfig: string = this.options.tabOrder;

    if (tabOrderConfig) {
      // sort tabs
      tabOrderConfig = tabOrderConfig.toLowerCase();
      tabOrderConfig = tabOrderConfig.replace(/ /g, "");
      var tabOrder: string[] = tabOrderConfig.split(",");

      if (tabOrder[0] === "thumbs") {
        this.$treeButton.before(this.$thumbsButton);
        this.$thumbsButton.addClass("first");
      } else {
        //this.$treeButton.addClass("first");
        this.$detailsTabButton.addClass("first");
      }
    }

    this.metadataComponent.on(
      "iiifViewerLinkClicked",
      (href: string) => {
        // Range change.
        const rangeId: string | null = Urls.getHashParameterFromString(
          "rid",
          href
        );
        // Time change.
        const time: string | null = Urls.getHashParameterFromString(
          "t",
          href
        );

        if (rangeId && time === null) {
          const range: Range | null = this.extension.helper.getRangeById(
            rangeId
          );

          if (range) {
            this.extensionHost.publish(IIIFEvents.RANGE_CHANGE, range);
          }
        }

        if (time !== null) {
          const timeAsNumber = Number(time);
          if (!Number.isNaN(timeAsNumber)) {

            if (rangeId) {
              // We want to make the time change RELATIVE to the start of the range.
              const range: Range | null = this.extension.helper.getRangeById(
                rangeId
              );
              if (range) {
                this.extensionHost.publish(IIIFEvents.RANGE_TIME_CHANGE, { rangeId: range.id, time: timeAsNumber });
              }
            } else {
              this.extensionHost.publish(IIIFEvents.CURRENT_TIME_CHANGE, timeAsNumber);
            }
          }
        }
      },
      false
    );

  }
  //Data bind for Metadata
  databind(): void {
    this.metadataComponent.set(this._getData());
  }

  checkTypeData():void {  
    if (typeof (this.extension) !== 'undefined' && this.extension != null) {
      const canvases = this.extension.getCurrentCanvases();
      const typeName = this.extension.type.name;
      const jsonId = canvases[0].__jsonld;
      if (typeName == "uv-openseadragon-extension") {      
        this._redirectUrl( "image/jpeg",  jsonId);
      }
      else if (typeName == "uv-pdf-extension") {
        this._redirectUrl("application/pdf", jsonId);
      }
      else if (typeName == "uv-mediaelement-extension") {
        this._redirectUrl("video/mp4", jsonId);        
      }   
    }
    else {
      let x = 2;
      console.log(x);
    }
  }

  private _redirectUrl(fortmatName : string, jsonId?: any): void {  
    if (jsonId) {      
      if (jsonId.format) {
        if (jsonId.format != fortmatName) {    
          
          init('uv', this.extension.data);      
        }
      }
    }
  }


  private _getData() {
    const canvases = this.extension.getCurrentCanvases();    
    let data = {
      canvasDisplayOrder: this.config.options.canvasDisplayOrder,
      canvases: canvases,
      canvasExclude: this.config.options.canvasExclude,
      canvasLabels: this.extension.getCanvasLabels(this.content.page),
      content: this.config.content,
      copiedMessageDuration: 2000,
      copyToClipboardEnabled: Bools.getBool(
        this.config.options.copyToClipboardEnabled,
        false
      ),
      helper: this.extension.helper,
      licenseFormatter: new UriLabeller(
        this.config.license ? this.config.license : {}
      ),
      limit: this.config.options.textLimit || 4,
      limitType: LimitType.LINES,
      limitToRange: Bools.getBool(this.config.options.limitToRange, false),
      manifestDisplayOrder: this.config.options.manifestDisplayOrder,
      manifestExclude: this.config.options.manifestExclude,
      range: this._getCurrentRange(),
      rtlLanguageCodes: this.config.options.rtlLanguageCodes,
      sanitizer: (html: string) => {
        return sanitize(html);
      },
      showAllLanguages: this.config.options.showAllLanguages,
    };
    
    return data;
  }

  private _getCurrentRange(): Range | null {
    const range: Range | null = this.extension.helper.getCurrentRange();
    return range;
  }

  updateDownloadButton(): void {
    const configEnabled: boolean = Bools.getBool(
      this.options.downloadEnabled,
      true
    );

    if (configEnabled) {
      this.$downloadButton.show();
    } else {
      this.$downloadButton.hide();
    }
  }


  render(): void {
    this.renderThumbs();
    //this.renderTree();
    this.renderGallery();
  }

  getViewingHint(): ViewingHint | null {
    return this.extension.helper.getViewingHint();
  }

  getViewingDirection(): ViewingDirection | null {
    return this.extension.helper.getViewingDirection();
  }

  createThumbsRoot(): void {
    if (!this.thumbsRoot) {
      this.thumbsRoot = createRoot(this.$thumbsView[0]);
    }
    this.renderThumbs();
  }

  renderThumbs(): void {
    if (!this.thumbsRoot) return;

    let width: number;
    let height: number;

    const viewingHint: ViewingHint | null = this.getViewingHint();
    const viewingDirection: ViewingDirection | null = this.getViewingDirection();

    if (
      viewingDirection &&
      (viewingDirection === ViewingDirectionEnum.LEFT_TO_RIGHT ||
        viewingDirection === ViewingDirectionEnum.RIGHT_TO_LEFT)
    ) {
      width = this.config.options.twoColThumbWidth;
      height = this.config.options.twoColThumbHeight;
    } else if (viewingHint && viewingHint === ViewingHintEnum.PAGED) {
      width = this.config.options.twoColThumbWidth;
      height = this.config.options.twoColThumbHeight;
    } else {
      width = this.config.options.oneColThumbWidth;
      height = this.config.options.oneColThumbHeight;
    }

    const thumbs: Thumb[] = <Thumb[]>(
      this.extension.helper.getThumbs(width, height)
    );

    if (
      viewingDirection &&
      viewingDirection === ViewingDirectionEnum.BOTTOM_TO_TOP
    ) {
      thumbs.reverse();
    }

    // add a search result icon for pages with results
    const searchResults: AnnotationGroup[] | null = (<OpenSeadragonExtension>(
      this.extension
    )).annotations;

    if (searchResults && searchResults.length) {
      for (let i = 0; i < searchResults.length; i++) {
        const searchResult: AnnotationGroup = searchResults[i];

        // find the thumb with the same canvasIndex and add the searchResult
        let thumb: Thumb = thumbs.filter(
          (t) => t.index === searchResult.canvasIndex
        )[0];

        if (thumb) {
          // clone the data so searchResults isn't persisted on the canvas.
          let data = Object.assign({}, thumb.data);
          data.searchResults = searchResult.rects.length;
          thumb.data = data;
        }
      }
    }

    const paged = !!this.extension.getSettings().pagingEnabled;

    const selectedIndices: number[] = this.extension.getPagedIndices(
      this.extension.helper.canvasIndex
    );

    // console.log("selectedIndeces", selectedIndices);

    this.thumbsRoot.render(
      createElement(ThumbsView, {
        thumbs,
        paged,
        viewingDirection: viewingDirection || ViewingDirection.LEFT_TO_RIGHT,
        selected: selectedIndices,
        onClick: (thumb: Thumb) => {
          this.extensionHost.publish(IIIFEvents.THUMB_SELECTED, thumb);
        },
      })
    );
  }

  createGalleryView(): void {
    this.galleryView = new GalleryView(this.$galleryView);
    this.galleryView.galleryData = this.getGalleryData();
    this.galleryView.setup();
    this.renderGallery();
  }

  renderGallery(): void {
    if (!this.galleryView) return;
    this.galleryView.galleryData = this.getGalleryData();
    this.galleryView.databind();
  }

  getGalleryData() {
    return {
      helper: this.extension.helper,
      chunkedResizingThreshold: this.config.options
        .galleryThumbChunkedResizingThreshold,
      content: this.config.content,
      debug: false,
      imageFadeInDuration: 300,
      initialZoom: 6,
      minLabelWidth: 20,
      pageModeEnabled: this.isPageModeEnabled(),
      scrollStopDuration: 100,
      searchResults: (<OpenSeadragonExtension>this.extension).annotations,
      sizingEnabled: true, // range API is IE11 up
      thumbHeight: this.config.options.galleryThumbHeight,
      thumbLoadPadding: this.config.options.galleryThumbLoadPadding,
      thumbWidth: this.config.options.galleryThumbWidth,
      viewingDirection: this.getViewingDirection(),
    };
  }

  isPageModeEnabled(): boolean {
    // todo: checks if the panel is being used in the openseadragon extension.
    // pass a `isPageModeEnabled` function to the panel's constructor instead?
    if (
      typeof (<OpenSeadragonExtension>this.extension).getMode === "function"
    ) {
      return (
        Bools.getBool(this.config.options.pageModeEnabled, true) &&
        (<OpenSeadragonExtension>this.extension).getMode().toString() ===
        Mode.page.toString()
      );
    }
    return Bools.getBool(this.config.options.pageModeEnabled, true);
  }


  expandFullStart(): void {
    super.expandFullStart();
    this.extensionHost.publish(IIIFEvents.LEFTPANEL_EXPAND_FULL_START);
  }

  expandFullFinish(): void {
    super.expandFullFinish();

    if (this.$thumbsButton.hasClass("on")) {
      this.openThumbsView();
    }

    this.extensionHost.publish(IIIFEvents.LEFTPANEL_EXPAND_FULL_FINISH);
  }

  collapseFullStart(): void {
    super.collapseFullStart();

    this.extensionHost.publish(IIIFEvents.LEFTPANEL_COLLAPSE_FULL_START);
  }

  collapseFullFinish(): void {
    super.collapseFullFinish();

    // todo: write a more generic tabs system with base tab class.
    // thumbsView may not necessarily have been created yet.
    // replace thumbsView with galleryView.
    if (this.$thumbsButton.hasClass("on")) {
      this.openThumbsView();
    }

    this.extensionHost.publish(IIIFEvents.LEFTPANEL_COLLAPSE_FULL_FINISH);
  }


  openThumbsView(): void {
    // this.isTreeViewOpen = false;
    this.isThumbsViewOpen = true;
    this.isDetailsViewOpen = false;
    // if (!this.$thumbsView) {
    this.createThumbsRoot();
    // }

    if (this.isFullyExpanded && !this.galleryView) {
      this.createGalleryView();
    }

    //this.$treeButton.removeClass("on");
    this.$thumbsButton.addClass("on");
    this.$detailsTabButton.removeClass("on");

    // if (this.treeView) this.treeView.hide();
    // this.$treeSelect.hide();
    // this.$treeViewOptions.hide();

    this.$detailsView.hide();
    this.resize();

    if (this.isFullyExpanded) {
      this.$thumbsView.hide();
      if (this.galleryView) this.galleryView.show();
      if (this.galleryView) this.galleryView.resize();
    } else {
      if (this.galleryView) this.galleryView.hide();
      this.$thumbsView.show();
      this.$thumbsView.resize();
    }

    this.extensionHost.publish(IIIFEvents.OPEN_THUMBS_VIEW);
  }

  openDetailsView(): void {
    //this.isTreeViewOpen = false;
    this.isThumbsViewOpen = false;
    this.isDetailsViewOpen = true;

    //this.$treeButton.removeClass("on");
    this.$thumbsButton.removeClass("on");
    this.$detailsTabButton.addClass("on");
    this.$detailsView.show();
    //this.$treeSelect.hide();
    //this.$treeViewOptions.hide();

    if (this.$thumbsView) this.$thumbsView.hide();
    if (this.galleryView) this.galleryView.hide();
  }

  // selectTopRangeIndex(index: number): void {
  //   this.$treeSelect.prop("selectedIndex", index);
  // }

  getCurrentCanvasTopRangeIndex(): number {
    let topRangeIndex: number = -1;

    const range: Range | null = this.extension.getCurrentCanvasRange();

    if (range) {
      topRangeIndex = Number(range.path.split("/")[0]);
    }

    return topRangeIndex;
  }



  // fall through to this is there's no current range or canvas
  selectTreeNodeByManifest(): void {
    const collectionIndex: number = this.extension.helper.collectionIndex;
    const manifestIndex: number = this.extension.helper.manifestIndex;

    const allNodes: TreeNode[] = this.treeView.getAllNodes();

    let nodeFound: boolean = false;

    allNodes.map((node) => {
      if (node.isCollection() && node.data.index === collectionIndex) {
        this.treeView.selectNode(node as TreeNode);
        this.treeView.expandNode(node as TreeNode, true);
        nodeFound = true;
      }

      if (node.isManifest() && node.data.index === manifestIndex) {
        this.treeView.selectNode(node as TreeNode);
        nodeFound = true;
      }
    });

    if (!nodeFound) {
      this.treeView.deselectCurrentNode();
    }
  }

  resize(): void {
    super.resize();
    let tabHeight = this.$main.height() - (isVisible(this.$tabs) ? this.$tabs.height() : 0) - this.$tabsContent.verticalPadding();
    this.$tabsContent.height(tabHeight - 40);
    let newHeight = (this.$tabsContent.height() - this.$options.outerHeight() - 40);
    this.$views.height(newHeight);
  }
}
