/* eslint-disable ghost/filenames/match-exported-class */
import {$createParagraphNode, $getRoot, $getSelection, CreateEditorArgs, type SerializedEditorState} from 'lexical';
import {createHeadlessEditor} from '@lexical/headless';
import {$generateNodesFromDOM} from '@lexical/html';
import {$insertGeneratedNodes} from '@lexical/clipboard';
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {ListItemNode, ListNode} from '@lexical/list';
import {LinkNode} from '@lexical/link';
import {DEFAULT_NODES} from '@tryghost/kg-default-nodes';
import {JSDOM} from 'jsdom';
import {registerDefaultTransforms} from '@tryghost/kg-default-transforms';

export interface htmlToLexicalOptions {
    editorConfig: CreateEditorArgs
}

const defaultNodes = [
    // basic HTML nodes
    HeadingNode,
    LinkNode,
    ListItemNode,
    ListNode,
    QuoteNode,

    // Koenig nodes
    ...DEFAULT_NODES
];

export function htmlToLexical(html: string, options?: htmlToLexicalOptions): SerializedEditorState {
    const defaultEditorConfig = {
        nodes: defaultNodes
    };
    const editorConfig = Object.assign({}, defaultEditorConfig, options?.editorConfig);

    const dom = new JSDOM(`<body>${html?.trim()}</body>`);
    const editor = createHeadlessEditor(editorConfig);

    registerDefaultTransforms(editor);

    editor.update(() => {
        // add a paragraph to avoid insertNodes throwing errors
        const paragraph = $createParagraphNode();
        $getRoot().append(paragraph);

        const nodes = $generateNodesFromDOM(editor, dom.window.document);

        // use @lexical/clipboard as it has additional logic for normalizing nodes
        const selection = $getRoot().select();
        $insertGeneratedNodes(editor, nodes, selection);

        // clean up the original empty paragraph
        paragraph.remove();
    }, {discrete: true});

    const editorState = editor.getEditorState();

    return editorState.toJSON();
}
