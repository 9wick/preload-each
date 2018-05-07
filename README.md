# preload-each

Preload all html on linked page.


## install and use
```html
<script async src="https://unpkg.com/preload-each/index.js" onload="new PreloadEach().start();"></script>
```

## api
```javascript
 new PreloadEach(options).start();
```

##options
```javascript
options = {
   targetDom : document, 
   maxFetchNum : 2,       
}

```


