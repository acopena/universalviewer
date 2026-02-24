import React, { useEffect, useRef } from "react";
import { Thumb } from "manifesto.js";
import { ViewingDirection, ViewingHint } from "@iiif/vocabulary";
import { useInView } from "react-intersection-observer";
import cx from "classnames";

const ThumbImage = ({
  first,
  onClick,
  paged,
  selected,
  thumb,
  viewingDirection,
  pagingEnabledPDF,  
}: {
  first: boolean;
  onClick: (thumb: Thumb) => void;
  paged: boolean;
  selected: boolean;
  thumb: Thumb;
  viewingDirection: ViewingDirection;
  pagingEnabledPDF: boolean;
}) => {
  const [ref, inView] = useInView({
    threshold: 0,
    rootMargin: "0px 0px 0px 0px",
    triggerOnce: true,
  });
  let eCopy = thumb.label;
  if (thumb.uri.indexOf('id') > -1) {
    let eCopyList = thumb.uri.split('&');
    let x = eCopyList.filter(s => s.indexOf('id') > -1);

    if (x) {
      let eCopyX = x[0].split('=');
      eCopy = eCopyX[1];
    }
  }
  
  //Overwrite thumbnails (Albert Opena)
  let thumbData = thumb.data;  
  if (thumbData) {
    if (thumbData.__jsonld.thumbnail) {
      const tjson = thumbData.__jsonld.thumbnail[0];

      if (tjson) {
        thumb.uri = tjson.id;
      }
    }
  }
  // End


  return (
    <div
      onClick={() => onClick(thumb)}
      className={cx("thumb", {
        first: first,
        placeholder: !thumb.uri,
        twoCol:
          paged && !pagingEnabledPDF &&
          (viewingDirection === ViewingDirection.LEFT_TO_RIGHT ||
            viewingDirection === ViewingDirection.RIGHT_TO_LEFT),
        oneCol: !paged || pagingEnabledPDF,
        selected: selected,
      })}
      tabIndex={0}
    >

      <div
        ref={ref}
        className="wrap"
        id={eCopy}
        style={{
          height: thumb.height + 8 + "px",
        }}
      >
        {inView && <img src={thumb.uri} alt={thumb.label} />}
      </div>
      <div className="info">
        {/* <span>{thumb.viewingHint}</span> */}
        <span className="label" title={thumb.label}>
          {thumb.label}&nbsp;
        </span>
        {thumb.data.searchResults && (
          <span className="searchResults">{thumb.data.searchResults}</span>
        )}
      </div>
    </div>
  );
};

const Thumbnails = ({
  onClick,
  paged,
  selected,
  thumbs,
  viewingDirection,
  pagingEnabledPDF
}: {
  onClick: (thumb: Thumb) => void;
  paged: boolean;
  selected: number[];
  thumbs: Thumb[];
  viewingDirection: ViewingDirection;
  pagingEnabledPDF: boolean;
}) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const thumb = ref.current?.querySelector(`#thumb-${selected[0]}`);
    thumb?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  }, [selected]);

  
  function showSeparator(
    paged: boolean,
    viewingHint: ViewingHint | null,
    index: number
  ) {
    
    if (viewingHint === ViewingHint.NON_PAGED) {
      return true;
    }

    if (paged) {
      // if paged, show separator after every 2 thumbs
      return !((index - 1) % 2 === 0);
    }

    return true;
  }

  const firstNonPagedIndex: number = thumbs.findIndex((t) => {
    return t.viewingHint !== ViewingHint.NON_PAGED;
  });

  return (   
    <div
      ref={ref}      
      className={cx("thumbs", {
        "left-to-right": viewingDirection === ViewingDirection.LEFT_TO_RIGHT,
        "right-to-left": viewingDirection === ViewingDirection.RIGHT_TO_LEFT,
        paged: paged,
      })}
    >
      {thumbs.map((thumb, index) => (
        <span key={`thumb-${index}`} id={`thumb-${index}`}>
          <ThumbImage
            first={index === firstNonPagedIndex}
            onClick={onClick}
            paged={paged}            
            selected={selected.includes(index)}
            thumb={thumb}
            viewingDirection={viewingDirection}
            pagingEnabledPDF={pagingEnabledPDF}
          />
          {showSeparator(paged, thumb.viewingHint, index) && (
            <div className="separator"></div>
          )}
        </span>
      ))}
    </div>
  );
};

export default Thumbnails;
