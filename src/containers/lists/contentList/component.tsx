import React from "react";
import "./contentList.css";
import { ContentListProps, ContentListState } from "./interface";
import StorageUtil from "../../../utils/storageUtil";
import _ from "underscore";
import RecordLocation from "../../../utils/readUtils/recordLocation";
class ContentList extends React.Component<ContentListProps, ContentListState> {
  constructor(props: ContentListProps) {
    super(props);
    this.state = {
      chapters: [],
      isCollapsed: true,
      currentIndex: -1,
      currentChapter: "",
      isExpandContent: StorageUtil.getReaderConfig("isExpandContent") === "yes",
    };
    this.handleJump = this.handleJump.bind(this);
  }

  componentWillMount() {
    //获取目录
    if (this.props.currentEpub.loaded) {
      this.props.currentEpub.loaded.navigation
        .then((chapters: any) => {
          this.setState({ chapters: chapters.toc });
        })
        .catch(() => {
          console.log("Error occurs");
        });
    }
  }
  componentDidMount() {
    this.props.htmlBook &&
      this.setState({
        chapters: this.props.htmlBook.chapters,
      });
  }
  handleJump(event: any) {
    event.preventDefault();
    let href = event.target.getAttribute("href");
    if (this.props.currentEpub && this.props.currentEpub.loaded) {
      this.props.currentEpub.rendition.display(href);
    } else {
      let id = href.substr(1);
      let title =
        this.state.chapters[_.findIndex(this.state.chapters, { id })].label;
      RecordLocation.recordScrollHeight(
        this.props.currentBook.key,
        "test",
        title,
        "test"
      );
      this.props.htmlBook.rendition.goToChapter(title);
      this.props.handleCurrentChapter(title);
    }
  }
  UNSAFE_componentWillReceiveProps(nextProps: ContentListProps) {
    if (nextProps.htmlBook && nextProps.htmlBook !== this.props.htmlBook) {
      this.setState({ chapters: nextProps.htmlBook.chapters });
    }
  }
  render() {
    const renderContentList = (items: any, level: number) => {
      level++;
      return items.map((item: any, index: number) => {
        return (
          <li key={index} className="book-content-list">
            {item.subitems.length > 0 &&
              level <= 2 &&
              !this.state.isExpandContent && (
                <span
                  className="icon-dropdown content-dropdown"
                  onClick={() => {
                    this.setState({
                      currentIndex:
                        this.state.currentIndex === index ? -1 : index,
                    });
                  }}
                  style={
                    this.state.currentIndex === index
                      ? {}
                      : { transform: "rotate(-90deg)" }
                  }
                ></span>
              )}

            <a
              href={item.href}
              onClick={this.handleJump}
              className="book-content-name"
            >
              {item.label.indexOf("#") > -1
                ? item.label.split("#")[0]
                : item.label}
            </a>
            {item.subitems.length > 0 &&
            (this.state.currentIndex === index ||
              level > 2 ||
              this.state.isExpandContent) ? (
              <ul>{renderContentList(item.subitems, level)}</ul>
            ) : null}
          </li>
        );
      });
    };

    return (
      <div className="book-content-container">
        <ul className="book-content">
          {this.state.chapters && renderContentList(this.state.chapters, 1)}
        </ul>
      </div>
    );
  }
}

export default ContentList;
