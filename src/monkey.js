import {TYPE_ATTRIBUTE} from './variables'
import { isOnBlacklist } from './checks'

const createElementBackup = document.createElement

const originalDescriptors = {
    src: Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src'),
    type: Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'type')
}

// function debounce(func, wait, immediate) {
//     var timeout;
//
//     return function executedFunction() {
//         var context = this;
//         var args = arguments;
//
//         var later = function() {
//             timeout = null;
//             if (!immediate) func.apply(context, args);
//         };
//
//         var callNow = immediate && !timeout;
//
//         clearTimeout(timeout);
//
//         timeout = setTimeout(later, wait);
//
//         if (callNow) func.apply(context, args);
//     };
// }
//
//
// let docFrag
// let supportsPrefetch
// try {
//     var relList = document.createElement('link').relList;
//     supportsPrefetch = !!(relList && relList.supports && relList.supports('prefetch'));
// } catch(e) {
//     supportsPrefetch = false
// }


// if(document.createDocumentFragment) {
//     docFrag = document.createDocumentFragment();
// }
// const runDebounce = debounce((current)=>{
//     document.head.appendChild(current);
//     docFrag = document.createDocumentFragment()
// },supportsPrefetch ? 1000 : 4000)

// const preloadBlockedResource = (src) => {
//     try {
//         if (window.PREVENT_PRELOAD) {
//             if (window.PREVENT_PRELOAD.some(pattern => pattern.test(src))) {
//                 return null
//             }
//         }
//         var preloadLink = document.createElement("link");
//         preloadLink.href = src
//         preloadLink.rel = supportsPrefetch ? "prefetch" : "preload"
//         preloadLink.as = "script";
//         if (docFrag) {
//             docFrag.appendChild(preloadLink);
//             runDebounce(docFrag)
//         } else {
//             document.head.appendChild(preloadLink);
//         }
//     } catch (e) {
//         console.error('Gate: Problem Preloading',e)
//     }
// }


// Monkey patch the createElement method to prevent dynamic scripts from executing
document.createElement = function(...args) {
    // If this is not a script tag, bypass
    if(args[0].toLowerCase() !== 'script')
        return createElementBackup.bind(document)(...args)

    const scriptElt = createElementBackup.bind(document)(...args)

    // Define getters / setters to ensure that the script type is properly set
    try {
        Object.defineProperties(scriptElt, {
            'src': {
                get() {
                    return originalDescriptors.src.get.call(this)
                },
                set(value) {
                    if(isOnBlacklist(value, scriptElt.type)) {
                        // try {preloadBlockedResource(value)} catch(e) {
                        //     //cannot preload
                        // }
                        originalDescriptors.type.set.call(this, TYPE_ATTRIBUTE)
                    }
                    originalDescriptors.src.set.call(this, value)
                }
            },
            'type': {
                set(value) {
                    const typeValue = isOnBlacklist(scriptElt.src, scriptElt.type) ? TYPE_ATTRIBUTE : value
                    originalDescriptors.type.set.call(this, typeValue)
                }
            }
        })

        // Monkey patch the setAttribute function so that the setter is called instead
        scriptElt.setAttribute = function(name, value) {
            if(name === 'type' || name === 'src')
                scriptElt[name] = value
            else
                HTMLScriptElement.prototype.setAttribute.call(scriptElt, name, value)
        }
    } catch (error) {
        // eslint-disable-next-line
        console.warn(
            'Yett: unable to prevent script execution for script src ', scriptElt.src, '.\n',
            'A likely cause would be because you are using a third-party browser extension that monkey patches the "document.createElement" function.'
        )
    }
    return scriptElt
}
