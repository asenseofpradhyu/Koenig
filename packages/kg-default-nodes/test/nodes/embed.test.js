// const {html} = require('../utils');
const {$getRoot} = require('lexical');
const {createHeadlessEditor} = require('@lexical/headless');
// const {$generateNodesFromDOM} = require('@lexical/html');
const {JSDOM} = require('jsdom');
// const Prettier = require('prettier');

const {EmbedNode, $createEmbedNode, $isEmbedNode} = require('../../');

const editorNodes = [EmbedNode];

describe('EmbedNode', function () {
    let editor;
    let dataset;
    let exportOptions;

    // NOTE: all tests should use this function, without it you need manual
    // try/catch and done handling to avoid assertion failures not triggering
    // failed tests
    const editorTest = testFn => function (done) {
        editor.update(() => {
            try {
                testFn();
                done();
            } catch (e) {
                done(e);
            }
        });
    };

    beforeEach(function () {
        editor = createHeadlessEditor({nodes: editorNodes});

        dataset = {
            url: 'https://www.ghost.org/',
            embedType: 'video',
            html: '<p>test</p>',
            metadata: {},
            caption: 'caption text'
        };

        exportOptions = {
            createDocument() {
                return (new JSDOM()).window.document; 
            }
        };
    });

    it('matches node with $isEmbedNode', editorTest(function () {
        const embedNode = $createEmbedNode(dataset);
        $isEmbedNode(embedNode).should.be.true;
    }));

    describe('data access', function () {
        it('has getters for all properties', editorTest(function () {
            const embedNode = $createEmbedNode(dataset);

            embedNode.getUrl().should.equal(dataset.url);
            embedNode.getEmbedType().should.equal(dataset.embedType);
            embedNode.getHtml().should.equal(dataset.html);
            embedNode.getMetadata().should.equal(dataset.metadata);
            embedNode.getCaption().should.equal(dataset.caption);
        }));

        it('has setters for all properties', editorTest(function () {
            const embedNode = $createEmbedNode();

            embedNode.getUrl().should.equal('');
            embedNode.setUrl('https://www.ghost.org/');
            embedNode.getUrl().should.equal('https://www.ghost.org/');

            embedNode.getEmbedType().should.equal('');
            embedNode.setEmbedType('https://www.ghost.org/favicon.ico');
            embedNode.getEmbedType().should.equal('https://www.ghost.org/favicon.ico');

            embedNode.getHtml().should.equal('');
            embedNode.setHtml('Ghost: The Creator Economy Platform');
            embedNode.getHtml().should.equal('Ghost: The Creator Economy Platform');

            embedNode.getMetadata().should.deepEqual({});
            embedNode.setMetadata({test: 'value'});
            embedNode.getMetadata().should.deepEqual({test: 'value'});

            embedNode.getCaption().should.equal('');
            embedNode.setCaption('caption here');
            embedNode.getCaption().should.equal('caption here');
        }));

        it('has getDataset() convenience method', editorTest(function () {
            const embedNode = $createEmbedNode(dataset);
            const embedNodeDataset = embedNode.getDataset();

            embedNodeDataset.should.deepEqual({
                ...dataset
            });
        }));

        it('has isEmpty() convenience method', editorTest(function () {
            const embedNode = $createEmbedNode(dataset);

            embedNode.isEmpty().should.be.false;
            embedNode.setUrl('');
            embedNode.isEmpty().should.be.true;
        }));
    });

    describe('exportDOM', function () {
        // it('creates an embed card', editorTest(function () {
        //     const embedNode = $createEmbedNode(dataset);
        //     const {element} = embedNode.exportDOM(exportOptions);

        //     const expectedHtml = `
        //         <figure class="kg-card kg-embed-card kg-card-hascaption">
        //             <a class="kg-embed-container" href="${dataset.url}">
        //                 <div class="kg-embed-content">
        //                     <div class="kg-embed-title">${dataset.title}</div>
        //                     <div class="kg-embed-description">${dataset.description}</div>
        //                     <div class="kg-embed-metadata">
        //                         <img class="kg-embed-icon" src="${dataset.icon}" alt="">
        //                         <span class="kg-embed-author">${dataset.author}</span>
        //                         <span class="kg-embed-publisher">${dataset.publisher}</span>
        //                     </div>
        //                 </div>
        //                 <div class="kg-embed-thumbnail">
        //                     <img src="${dataset.thumbnail}" alt="">
        //                 </div>
        //             </a>
        //             <figcaption>${dataset.caption}</figcaption>
        //         </figure>
        //     `;

        //     const prettyExpectedHtml = Prettier.format(expectedHtml, {parser: 'html'});

        //     element.outerHTML.should.prettifyTo(prettyExpectedHtml);
        // })); 

        it('renders nothing with missing data', editorTest(function () {
            const embedNode = $createEmbedNode();
            const {element} = embedNode.exportDOM(exportOptions);

            element.textContent.should.equal('');
            should(element.outerHTML).be.undefined();
        }));
    });

    describe('exportJSON', function () {
        it('contains all data', editorTest(function () {
            const embedNode = $createEmbedNode(dataset);
            const json = embedNode.exportJSON();

            json.should.deepEqual({
                type: 'embed',
                version: 1,
                url: dataset.url,
                embedType: dataset.embedType,
                html: dataset.html,
                metadata: dataset.metadata,
                caption: dataset.caption
            });
        }));
    });

    describe('importJSON', function () {
        it('imports all data', function (done) {
            const serializedState = JSON.stringify({
                root: {
                    children: [{
                        type: 'embed',
                        ...dataset
                    }],
                    direction: null,
                    format: '',
                    indent: 0,
                    type: 'root',
                    version: 1
                }
            });

            const editorState = editor.parseEditorState(serializedState);
            editor.setEditorState(editorState);

            editor.getEditorState().read(() => {
                try {
                    const [embedNode] = $getRoot().getChildren();

                    embedNode.getUrl().should.equal(dataset.url);
                    embedNode.getEmbedType().should.equal(dataset.embedType);
                    embedNode.getHtml().should.equal(dataset.html);
                    embedNode.getMetadata().should.deepEqual(dataset.metadata);
                    embedNode.getCaption().should.equal(dataset.caption);

                    done();
                } catch (e) {
                    done(e);
                }
            });
        });
    });

    describe('hasEditMode', function () {
        it('returns true', editorTest(function () {
            const embedNode = $createEmbedNode(dataset);
            embedNode.hasEditMode().should.be.true;
        }));
    });

    describe('clone', function () {
        it('clones the node', editorTest(function () {
            const embedNode = $createEmbedNode(dataset);
            const clonedEmbedNode = EmbedNode.clone(embedNode);
            $isEmbedNode(clonedEmbedNode).should.be.true;
            clonedEmbedNode.getUrl().should.equal(dataset.url);
        }));
    });

    describe('static properties', function () {
        it('getType', editorTest(function () {
            EmbedNode.getType().should.equal('embed');
        }));

        it('urlTransformMap', editorTest(function () {
            EmbedNode.urlTransformMap.should.deepEqual({
                url: 'url'
            });
        }));
    });

    // describe('importDOM', function () {
    //     it('parses embed card', editorTest(function () {
    //         const dom = (new JSDOM(html`
    //             <figure class="kg-card kg-embed-card kg-card-hascaption">
    //                 <a class="kg-embed-container" href="${dataset.url}">
    //                     <div class="kg-embed-content">
    //                         <div class="kg-embed-title">${dataset.title}</div>
    //                         <div class="kg-embed-description">${dataset.description}</div>
    //                         <div class="kg-embed-metadata">
    //                             <img class="kg-embed-icon" src="${dataset.icon}" alt="">
    //                             <span class="kg-embed-author">${dataset.author}</span>
    //                             <span class="kg-embed-publisher">${dataset.publisher}</span>
    //                         </div>
    //                     </div>
    //                     <div class="kg-embed-thumbnail">
    //                         <img src="${dataset.thumbnail}" alt="">
    //                     </div>
    //                 </a>
    //                 <figcaption>${dataset.caption}</figcaption>
    //             </figure>
    //         `)).window.document;
    //         const nodes = $generateNodesFromDOM(editor, dom);

    //         nodes.length.should.equal(1);
    //         nodes[0].getUrl().should.equal(dataset.url);
    //         nodes[0].getIcon().should.equal(dataset.icon);
    //         nodes[0].getTitle().should.equal(dataset.title);
    //         nodes[0].getDescription().should.equal(dataset.description);
    //         nodes[0].getAuthor().should.equal(dataset.author);
    //         nodes[0].getPublisher().should.equal(dataset.publisher);
    //         nodes[0].getThumbnail().should.equal(dataset.thumbnail);
    //         nodes[0].getCaption().should.equal(dataset.caption);
    //     }));
    // });
});