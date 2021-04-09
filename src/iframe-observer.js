// import {isOnBlacklist} from "./checks";
//eslint-disable-next-line
// import {backupScripts, TYPE_ATTRIBUTE} from "./variables";
const createdFrames = []
const debugGate = window.localStorage.getItem('debugGate');
const iframeObserver = new MutationObserver(mutations => {
    for (let i = 0; i < mutations.length; i++) {
        const { addedNodes } = mutations[i];
        for(let i = 0; i < addedNodes.length; i++) {
            const node = addedNodes[i]
            // For each added script tag
            if(node.nodeType === 1 && node.tagName === 'IFRAME') {
                const src = node.src
                // If the src is inside the blacklist and is not inside the whitelist
                if(src && createdFrames.includes(src)) {

                    // We backup the node
                    // backupScripts.blacklisted.push([node, node.type])

                    // Blocks inline script execution in Safari & Chrome
                    // node.type = TYPE_ATTRIBUTE

                    // Firefox has this additional event which prevents scripts from beeing executed
                    // const beforeScriptExecuteListener = function (event) {
                    //     // Prevent only marked scripts from executing
                    //     if(node.getAttribute('type') === TYPE_ATTRIBUTE)
                    //         event.preventDefault()
                    //     node.removeEventListener('beforescriptexecute', beforeScriptExecuteListener)
                    // }
                    // node.addEventListener('beforescriptexecute', beforeScriptExecuteListener)
                    // Remove the node from the DOM
                    const allFrames = document.querySelectorAll("iframe[src^='https://bid.g.doubleclick.net/xbbe/pixel']")
                    let count = 0
                    allFrames.forEach((node)=>{
                        if(debugGate) {
                            console.log('keeping node', node);
                        }
                        if(count !== 1) {
                            if(debugGate) {
                                console.log('removing duplicate node', node);
                            }
                            node.parentElement && node.parentElement.removeChild(node);
                        }
                        count++
                    })

                    return
                }
                if(src) {
                    createdFrames.push(src)
                }
            }
        }
    }
})

// Starts the monitoring
iframeObserver.observe(document.documentElement, {
    childList: true,
    subtree: true
})