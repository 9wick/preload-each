class PreloadEach {

  static get TYPE() {
    return {
      HTML: "document",
      SCRIPT: "script",
      IMAGE: "image",
    }
  };


  constructor(options) {

    this.queue = [];
    this.currentQueue = [];
    this.finishedQueue = [];

    options = options || {};
    this.options  = {
      targetDom:  options.targetDom || document,
      maxFetchNum: options.maxFetchNum || 2 ,
      maxNest:  options.maxNest || 4,
      onlyHover:  options.onlyHover || false,
    };
  }

  start() {
    if (
        this.options.targetDom.readyState === "complete" ||
        (this.options.targetDom.readyState !== "loading" && !this.options.targetDom.documentElement.doScroll)
    ) {
      this.loadedEvent();
    } else {
      this.options.targetDom.addEventListener("DOMContentLoaded", this.loadedEvent.bind(this));
    }
  }


  addHoverEventListener(dom){
    let aDomList = dom.querySelectorAll("a");
    for(let aDom of aDomList){
      aDom.addEventListener("mouseover",this.hoverEvent.bind(this));
      aDom.addEventListener("touchstart",this.hoverEvent.bind(this));
    }

  }

  loadedEvent(){
    if(!this.options.onlyHover){
      this.addQueueFromTagName(this.options.targetDom, "a", "href", PreloadEach.TYPE.HTML, 1);
    }

    this.addHoverEventListener(this.options.targetDom);
  }

  hoverEvent(event){
    console.log(event);
    this.addQueue(event.target.href,  PreloadEach.TYPE.HTML, 1);
  }

  addQueueFromDom(dom, nest) {
    this.addQueueFromTagName(dom, "a", "href", PreloadEach.TYPE.HTML, nest);
    this.addQueueFromTagName(dom, "img", "src", PreloadEach.TYPE.IMAGE, nest);
    this.addQueueFromTagName(dom, "link", "href", PreloadEach.TYPE.SCRIPT, nest);
    this.addQueueFromTagName(dom, "script", "src", PreloadEach.TYPE.SCRIPT, nest);
  }

  addQueueFromTagName(dom, tagName, urlAttrName, type, nest) {
    let elements = dom.querySelectorAll(tagName);
    for (let e of elements) {
      if (e[urlAttrName]) {
        this.addQueue(e[urlAttrName], type, nest);
      }
    }
  }

  addQueue(url, type, nest) {
    if (this.isTargetUrl(url) && !this.isExistInQueue(url)) {
      console.log(url);
      let one = {url, type, nest};
      this.queue.push(one);
    }
    setTimeout(this.execQueue.bind(this),0);
  }

  isExistInQueue(url) {
    if (this.queue.filter((elm) => {
          return url === elm.url
        }).length > 0) {
      return true;
    }
    if (this.currentQueue.filter((elm) => {
          return url === elm.url
        }).length > 0) {
      return true;
    }
    if (this.finishedQueue.filter((elm) => {
          return url === elm.url
        }).length > 0) {
      return true;
    }

    return false;
  }

  isTargetUrl(url) {
    if (location.href === url) {
      return false;
    }
    return true;
  }


  execQueue() {
    if (this.currentQueue >= this.options.maxFetchNum) {
      return;
    }
    if (this.queue.length === 0) {
      return;
    }
    let one = this.queue.shift();
    this.currentQueue.push(one);

    let targetPromise;
    if (one.type === PreloadEach.TYPE.HTML) {
      targetPromise = this.execHtml(one);
    } else if (one.type === PreloadEach.TYPE.SCRIPT) {
      targetPromise = this.execScript(one);
    } else if (one.type === PreloadEach.TYPE.IMAGE) {
      targetPromise = this.execImage(one);
    } else {
      targetPromise = Promise.resolve();
    }

    return targetPromise.catch((err) => {
      console.error(err);
      return Promise.resolve();
    }).then(() => {
      let index = this.currentQueue.indexOf(one);
      if (index >= 0) {
        this.currentQueue.splice(index, 1);
      }
      this.finishedQueue.push(one);
      this.execQueue();
    });

  }

  execHtml(one) {
    return fetch(one.url, {
      mode: 'no-cors',
      cache: "force-cache",
      credentials: 'same-origin'
    }).then((response) => {
      return response.text();
    }).then((text) => {
      if (one.type === PreloadEach.TYPE.HTML && one.nest <= this.options.maxNest) {
        let dom = document.createDocumentFragment("html");   // querySelector is not work
        // let dom = document.createElement("html");
        dom.innerHTML = text;
        this.addQueueFromDom(dom, one.nest + 1);
      }

      return this.createPreloadTag(one);

    })
  }

  execScript(one) {
    return this.createPreloadTag(one);
  }

  execImage(one) {
    return this.createPreloadTag(one);
  }

  createPreloadTag(one) {
    return new Promise((resolve) => {
      let linkDom = document.createElement("link");
      if (linkDom.relList.supports("prefetch")) {
        linkDom.rel = "prefetch";
        linkDom.as = one.type;
      } else {
        linkDom.rel = "preload";
        linkDom.as = "fetch";
      }
      linkDom.href = one.url;
      console.log(linkDom);

      document.head.appendChild(linkDom);

      resolve();
    });
  }


}



