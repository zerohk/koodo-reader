import React from "react";
import EpubViewer from "../epubViewer";
import PageWidget from "../pageWidget";
import SettingPanel from "../panels/settingPanel";
import NavigationPanel from "../panels/navigationPanel";
import OperationPanel from "../panels/operationPanel";
import ProgressPanel from "../panels/progressPanel";
import { ReaderProps, ReaderState } from "./interface";
import { EpubMouseEvent } from "../../utils/mouseEvent";
import StorageUtil from "../../utils/storageUtil";
import ReadingTime from "../../utils/readUtils/readingTime";
import Background from "../../components/background";
let lock = false;
class Reader extends React.Component<ReaderProps, ReaderState> {
  messageTimer!: NodeJS.Timeout;
  tickTimer!: NodeJS.Timeout;
  rendition: any;

  constructor(props: ReaderProps) {
    super(props);
    this.state = {
      isOpenRightPanel:
        StorageUtil.getReaderConfig("isSettingLocked") === "yes" ? true : false,
      isOpenTopPanel: false,
      isOpenBottomPanel: false,
      isOpenLeftPanel:
        StorageUtil.getReaderConfig("isNavLocked") === "yes" ? true : false,
      rendition: null,
      hoverPanel: "",
      scale: StorageUtil.getReaderConfig("scale") || 1,
      margin: parseInt(StorageUtil.getReaderConfig("margin")) || 30,
      time: ReadingTime.getTime(this.props.currentBook.key),
      isTouch: StorageUtil.getReaderConfig("isTouch") === "yes",
      isPreventTrigger:
        StorageUtil.getReaderConfig("isPreventTrigger") === "yes",
      readerMode: StorageUtil.getReaderConfig("readerMode") || "double",
      isHideBackground:
        StorageUtil.getReaderConfig("isHideBackground") === "yes",
    };
  }
  componentWillMount() {
    this.props.handleFetchBookmarks();
    this.props.handleFetchPercentage(this.props.currentBook);
    this.props.handleFetchNotes();
    this.props.handleFetchBooks();
    this.props.handleFetchChapters(this.props.currentEpub);
  }

  componentDidMount() {
    this.handleRenderBook();
    this.props.handleRenderFunc(this.handleRenderBook);
    var doit;
    window.addEventListener("resize", () => {
      clearTimeout(doit);
      doit = setTimeout(this.handleRenderBook, 100);
    });
    this.tickTimer = global.setInterval(() => {
      let time = this.state.time;
      time += 1;
      this.setState({ time });

      //解决快速翻页过程中图书消失的bug
      let renderedBook = document.querySelector(".epub-view");
      if (
        renderedBook &&
        !renderedBook.innerHTML &&
        this.state.readerMode !== "scroll"
      ) {
        this.handleRenderBook();
      }
    }, 1000);
  }
  componentWillUnmount() {
    clearInterval(this.tickTimer);
  }
  handleRenderBook = () => {
    let page = document.querySelector("#page-area");
    let epub = this.props.currentEpub;
    if (!page) return;
    if (page.innerHTML) {
      page.innerHTML = "";
    }

    this.setState({ rendition: null }, () => {
      (window as any).rangy.init(); // 初始化
      this.rendition = epub.renderTo(page, {
        manager: "default",
        flow: this.state.readerMode === "scroll" ? "scrolled" : "auto",
        width: "100%",
        height: "100%",
        snap: true,
        spread:
          StorageUtil.getReaderConfig("readerMode") === "single" ? "none" : "",
      });
      this.setState({ rendition: this.rendition });
      this.state.readerMode !== "scroll" && EpubMouseEvent(this.rendition); // 绑定事件
    });
  };

  //进入阅读器
  handleEnterReader = (position: string) => {
    //控制上下左右的菜单的显示
    switch (position) {
      case "right":
        this.setState({
          isOpenRightPanel: this.state.isOpenRightPanel ? false : true,
        });
        break;
      case "left":
        this.setState({
          isOpenLeftPanel: this.state.isOpenLeftPanel ? false : true,
        });
        break;
      case "top":
        this.setState({
          isOpenTopPanel: this.state.isOpenTopPanel ? false : true,
        });
        break;
      case "bottom":
        this.setState({
          isOpenBottomPanel: this.state.isOpenBottomPanel ? false : true,
        });
        break;
      default:
        break;
    }
  };
  //退出阅读器
  handleLeaveReader = (position: string) => {
    //控制上下左右的菜单的显示
    switch (position) {
      case "right":
        if (StorageUtil.getReaderConfig("isSettingLocked") === "yes") {
          break;
        } else {
          this.setState({ isOpenRightPanel: false });
          break;
        }

      case "left":
        if (StorageUtil.getReaderConfig("isNavLocked") === "yes") {
          break;
        } else {
          this.setState({ isOpenLeftPanel: false });
          break;
        }
      case "top":
        this.setState({ isOpenTopPanel: false });
        break;
      case "bottom":
        this.setState({ isOpenBottomPanel: false });
        break;
      default:
        break;
    }
  };
  nextPage = () => {
    if (lock) return;
    this.state.rendition.next();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, 400);
    return false;
  };
  prevPage = () => {
    if (lock) return;
    this.state.rendition.prev();
    lock = true;
    setTimeout(function () {
      lock = false;
    }, 400);
    return false;
  };
  render() {
    const renditionProps = {
      rendition: this.state.rendition,
      handleLeaveReader: this.handleLeaveReader,
      handleEnterReader: this.handleEnterReader,
      isShow:
        this.state.isOpenLeftPanel ||
        this.state.isOpenTopPanel ||
        this.state.isOpenBottomPanel ||
        this.state.isOpenRightPanel,
    };
    return (
      <div className="viewer">
        {StorageUtil.getReaderConfig("isHidePageButton") !== "yes" && (
          <>
            <div
              className="previous-chapter-single-container"
              onClick={() => {
                this.prevPage();
              }}
            >
              <span className="icon-dropdown previous-chapter-single"></span>
            </div>
            <div
              className="next-chapter-single-container"
              onClick={() => {
                this.nextPage();
              }}
            >
              <span className="icon-dropdown next-chapter-single"></span>
            </div>
          </>
        )}
        {StorageUtil.getReaderConfig("isHideMenuButton") !== "yes" && (
          <div
            className="reader-setting-icon-container"
            onClick={() => {
              this.handleEnterReader("left");
              this.handleEnterReader("right");
              this.handleEnterReader("bottom");
              this.handleEnterReader("top");
            }}
          >
            <span className="icon-grid reader-setting-icon"></span>
          </div>
        )}
        <div
          className="left-panel"
          onMouseEnter={() => {
            if (
              this.state.isTouch ||
              this.state.isOpenLeftPanel ||
              this.state.isPreventTrigger
            ) {
              this.setState({ hoverPanel: "left" });
              return;
            }
            this.handleEnterReader("left");
          }}
          onMouseLeave={() => {
            this.setState({ hoverPanel: "" });
          }}
          style={this.state.hoverPanel === "left" ? { opacity: 0.5 } : {}}
          onClick={() => {
            this.handleEnterReader("left");
          }}
        >
          <span className="icon-grid panel-icon"></span>
        </div>
        <div
          className="right-panel"
          onMouseEnter={() => {
            if (
              this.state.isTouch ||
              this.state.isOpenRightPanel ||
              this.state.isPreventTrigger
            ) {
              this.setState({ hoverPanel: "right" });
              return;
            }
            this.handleEnterReader("right");
          }}
          onMouseLeave={() => {
            this.setState({ hoverPanel: "" });
          }}
          style={this.state.hoverPanel === "right" ? { opacity: 0.5 } : {}}
          onClick={() => {
            this.handleEnterReader("right");
          }}
        >
          <span className="icon-grid panel-icon"></span>
        </div>
        <div
          className="top-panel"
          onMouseEnter={() => {
            if (
              this.state.isTouch ||
              this.state.isOpenTopPanel ||
              this.state.isPreventTrigger
            ) {
              this.setState({ hoverPanel: "top" });
              return;
            }
            this.handleEnterReader("top");
          }}
          onMouseLeave={() => {
            this.setState({ hoverPanel: "" });
          }}
          style={this.state.hoverPanel === "top" ? { opacity: 0.5 } : {}}
          onClick={() => {
            this.handleEnterReader("top");
          }}
        >
          <span className="icon-grid panel-icon"></span>
        </div>
        <div
          className="bottom-panel"
          onMouseEnter={() => {
            if (
              this.state.isTouch ||
              this.state.isOpenBottomPanel ||
              this.state.isPreventTrigger
            ) {
              this.setState({ hoverPanel: "bottom" });
              return;
            }
            this.handleEnterReader("bottom");
          }}
          onMouseLeave={() => {
            this.setState({ hoverPanel: "" });
          }}
          style={this.state.hoverPanel === "bottom" ? { opacity: 0.5 } : {}}
          onClick={() => {
            this.handleEnterReader("bottom");
          }}
        >
          <span className="icon-grid panel-icon"></span>
        </div>

        {this.state.rendition && this.props.currentEpub.rendition && (
          <EpubViewer {...renditionProps} />
        )}
        <div
          className="setting-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader("right");
          }}
          style={
            this.state.isOpenRightPanel
              ? {}
              : {
                  transform: "translateX(309px)",
                }
          }
        >
          <SettingPanel />
        </div>
        <div
          className="navigation-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader("left");
          }}
          style={
            this.state.isOpenLeftPanel
              ? {}
              : {
                  transform: "translateX(-309px)",
                }
          }
        >
          <NavigationPanel {...{ time: this.state.time }} />
        </div>
        <div
          className="progress-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader("bottom");
          }}
          style={
            this.state.isOpenBottomPanel
              ? {}
              : {
                  transform: "translateY(110px)",
                }
          }
        >
          <ProgressPanel {...{ time: this.state.time }} />
        </div>
        <div
          className="operation-panel-container"
          onMouseLeave={(event) => {
            this.handleLeaveReader("top");
          }}
          style={
            this.state.isOpenTopPanel
              ? {}
              : {
                  transform: "translateY(-110px)",
                }
          }
        >
          <OperationPanel {...{ time: this.state.time }} />
        </div>
        <div
          className="view-area-page"
          id="page-area"
          style={
            document.body.clientWidth < 570
              ? { left: 0, right: 0 }
              : this.state.readerMode === "scroll"
              ? {
                  left: `calc(50vw - ${270 * parseFloat(this.state.scale)}px)`,
                  right: `calc(50vw - ${270 * parseFloat(this.state.scale)}px)`,
                  top: "75px",
                  bottom: "75px",
                }
              : this.state.readerMode === "single"
              ? {
                  left: `calc(50vw - ${270 * parseFloat(this.state.scale)}px)`,
                  right: `calc(50vw - ${270 * parseFloat(this.state.scale)}px)`,
                }
              : this.state.readerMode === "double"
              ? {
                  left: this.state.margin - 40 + "px",
                  right: this.state.margin - 40 + "px",
                }
              : {}
          }
        >
          <span className="icon-grid reader-setting-icon"></span>
        </div>
        {this.state.isHideBackground ? null : <Background />}

        <PageWidget {...{ time: this.state.time }} />
      </div>
    );
  }
}

export default Reader;
