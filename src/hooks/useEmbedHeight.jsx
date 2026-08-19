import { useEffect } from 'react';

// Reports the document height to the embedding page so a host that listens for it
// can size the iframe to its content. Hosts that ignore the message just keep
// whatever fixed height they set.
export const EMBED_HEIGHT_MESSAGE = 'calib-embed:height';

export const useEmbedHeight = (ref) => {
    useEffect(() => {
        const element = ref.current;
        // Only meaningful when framed; posting to ourselves would be noise.
        if (!element || window.parent === window) return;

        const post = () => {
            window.parent.postMessage(
                { type: EMBED_HEIGHT_MESSAGE, height: Math.ceil(element.scrollHeight) },
                '*',
            );
        };

        post();
        const observer = new ResizeObserver(post);
        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);
};
