class PreloadEach {


  static get TYPE(){
    return {
      HTML: "html",
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
    };
    this.options = Object.assign(defaultOptions, options);
  }

  start(){
    if (
      this.options.targetDom.readyState === "complete" ||
      (this.options.targetDom.readyState !== "loading" && !this.options.targetDom.documentElement.doScroll)
    ) {
      this.addQueueFromDom(this.options.targetDom);
    } else {
      this.options.addEventListener("DOMContentLoaded", ()=>{this.addQueueFromDom(this.options.targetDom);});
    }
  }

  addQueueFromDom(dom){
    this.addQueueFromTagName(dom, "a", "href", PreloadEach.TYPE.HTML);
    this.addQueueFromTagName(dom, "img", "src", PreloadEach.TYPE.IMAGE);
    this.addQueueFromTagName(dom, "link", "href", PreloadEach.TYPE.SCRIPT);
    this.addQueueFromTagName(dom, "script", "src", PreloadEach.TYPE.SCRIPT);
  }

  addQueueFromTagName(dom,tagName,urlAttrName,type){
    let elements = dom.getElementsByTagName(tagName);
    for(let e of elements){
      if(e[urlAttrName]){
        this.addQueue(e[urlAttrName], type);
      }
    }
  }

  addQueue(url, type){
    let one = {url, type};
    if(!this.queue.includes(one) && !this.currentQueue.includes(one) && !this.finishedQueue.includes(one) ){
      this.queue.push(one);
    }
    this.execQueue();
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

    return fetch(one.url,{
      mode: 'no-cors',
      credentials: 'include'
    }).then((response) => {
      return response.text();
    }).then((text) => {
      if(one.type === PreloadEach.TYPE.HTML ){
        let dom = document.createDocumentFragment();
        dom.innerHTML = text;
        this.addQueueFromDom(dom);
      }

      let index = this.currentQueue.indexOf(one);
      if(index >= 0){
        this.currentQueue.splice(index,1);
      }
      this.finishedQueue.append(one);
      this.execQueue();
    });

  }

}



