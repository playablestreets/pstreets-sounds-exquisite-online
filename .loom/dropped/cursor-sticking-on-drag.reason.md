# why cursor-sticking-on-drag was dropped

Verified fixed in the current build — colleague confirmed cursor no longer sticks on click-to-drag. Likely incidental fix from removing the duplicate render loop (double-render-loop) which was multiplying rAF passes per frame and could leave the drag-end event delayed.
