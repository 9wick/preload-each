class PreloadEach {


  static get TYPE(){
    return {
      HTML: "document",
      SCRIPT: "script",
      IMAGE: "image",
    }
  };


  constructor(options){
    this.options = {};
    this.queue = [];
    this.currentQueue = [];
    this.finishedQueue = [];

    let defaultOptions = {
      targetDom : document,
      maxFetchNum : 2,
      maxNest : 4,
    };
    this.options = Object.assign(defaultOptions, options);
  }

  start(){
    if (
      this.options.targetDom.readyState === "complete" ||
      (this.options.targetDom.readyState !== "loading" && !this.options.targetDom.documentElement.doScroll)
    ) {
      this.addQueueFromDom(this.options.targetDom, 1);
    } else {
      this.options.targetDom.addEventListener("DOMContentLoaded", ()=>{this.addQueueFromDom(this.options.targetDom, 1);});
    }
  }

  addQueueFromDom(dom, nest){
    this.addQueueFromTagName(dom, "a", "href", PreloadEach.TYPE.HTML, nest);
    this.addQueueFromTagName(dom, "img", "src", PreloadEach.TYPE.IMAGE, nest);
    this.addQueueFromTagName(dom, "link", "href", PreloadEach.TYPE.SCRIPT, nest);
    this.addQueueFromTagName(dom, "script", "src", PreloadEach.TYPE.SCRIPT, nest);
  }

  addQueueFromTagName(dom,tagName,urlAttrName,type, nest){
    let elements = dom.getElementsByTagName(tagName);
    for(let e of elements){
      if(e[urlAttrName]){
        this.addQueue(e[urlAttrName], type, nest);
      }
    }
  }

  addQueue(url, type, nest){
    if( this.isTargetUrl(url) && !this.isExistInQueue(url) ){
      console.log(url);
      let one = {url, type, nest};
      this.queue.push(one);
    }
    this.execQueue();
  }

  isExistInQueue(url){
    if(this.queue.filter((elm)=>{return url === elm.url}).length > 0){
      return true;
    }
    if(this.currentQueue.filter((elm)=>{return url === elm.url}).length > 0){
      return true;
    }
    if(this.finishedQueue.filter((elm)=>{return url === elm.url}).length > 0){
      return true;
    }

    return false;
  }

  isTargetUrl(url){
    if(location.href === url){
      return false;
    }
    return true;
  }


  execQueue(){
    if(this.currentQueue >= this.options.maxFetchNum){
      return;
    }
    if(this.queue.length === 0){
      return;
    }
    let one = this.queue.shift();
    this.currentQueue.push(one);

    let targetPromise;
    if(one.type === PreloadEach.TYPE.HTML){
      targetPromise = this.execHtml(one);
    }else if(one.type === PreloadEach.TYPE.SCRIPT){
      targetPromise = this.execScript(one);
    }else if(one.type === PreloadEach.TYPE.IMAGE){
      targetPromise = this.execImage(one);
    }else{
      targetPromise = new Promise((r)=>{r()});
    }

    return targetPromise.catch((err) =>{
      console.error(err);
      return new Promise((r)=>r());
    }).then(()=>{
      let index = this.currentQueue.indexOf(one);
      if(index >= 0){
        this.currentQueue.splice(index,1);
      }
      this.finishedQueue.push(one);
      this.execQueue();
    });

  }

  execHtml(one){
    return fetch(one.url,{
      mode: 'no-cors',
      cache : "force-cache",
      credentials: 'same-origin'
    }).then((response) => {
      return response.text();
    }).then((text) => {
      if(one.type === PreloadEach.TYPE.HTML && one.nest <= this.options.maxNest){
        let dom = document.createElement("html");
        dom.innerHTML = text;
        this.addQueueFromDom(dom,one.nest+1);
      }

      return this.createPreloadTag(one);

    })
  }

  execScript(one){
    return this.createPreloadTag(one);
  }

  execImage(one){
      return this.createPreloadTag(one);
  }

  createPreloadTag(one){
    return new Promise((resolve)=>{
      // let preloadDom = document.createElement("link");
      // preloadDom.rel = "preload";
      // preloadDom.as = one.type;
      // preloadDom.href = one.url;

      let prefetchDom = document.createElement("link");
      prefetchDom.rel = "prefetch";
      prefetchDom.as = one.type;
      prefetchDom.href = one.url;

      resolve();
    });
  }

}



