// ==UserScript==
// @name         Kic-Search
// @namespace    https://www.kidsincinema.com/
// @version      1.1
// @description  为豆瓣、IMDb和光影童年网站添加电影搜索快捷功能
// @author       @shuizifan (&Claude-3.5)
// @match        https://movie.douban.com/subject/*
// @match        https://www.kidsincinema.com/forum/forum.php?mod=viewthread&tid=*
// @match        https://www.imdb.com/title/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        SEARCH_LINKS: {
            douban: {
                name: '豆瓣',
                url: 'https://search.douban.com/movie/subject_search?search_text={imdbID}'
            },
            imdb: {
                name: 'IMDb',
                url: 'https://www.imdb.com/title/{imdbID}'
            },
            tmdb: {
                name: 'TMDB',
                url: 'https://www.themoviedb.org/search?query={title}'
            },
            bluray: {
                name: 'Blu-ray',
                url: 'http://www.blu-ray.com/search/?section=bluraymovies&quicksearch_keyword={title}&quicksearch=1'
            },
            mediaInfo: {
                name: 'MediaInfo',
                url: 'https://mediaarea.net/MediaInfoOnline'
            },
            zmk: {
                name: '【ZMK】',
                url: 'http://zmk.pw/search?q={imdbID}'
            },
            openSub: {
                name: '【OpenSub】',
                url: 'https://www.opensubtitles.org/zh/search/sublanguageid-chi,zht,zhe,eng/imdbid-{imdbID}'
            },
            kic: {
                name: '光影童年',
                url: 'https://www.kidsincinema.com/forum/search.php?mod=forum&searchsubmit=yes&srchtxt={imdbID}'
            },
            blizzardkid: {
                name: 'Blizzardkid',
                url: 'http://blizzardkid.net/?action=search&search={imdbID}'
            },
            tnt: {
                name: 'TNT',
                searchUrl: 'https://the.nextthing.club/search.php'
            },
            bt4g: {
                name: 'BT4G',
                url: 'https://bt4gprx.com/search?q={title}+{year}&orderby=size&p=1'
            },
            bt0: {
                name: '不太灵',
                url: 'https://www.0bt0.com/search?sb={chineseTitle}'
            }
        },
        STYLES: {
            douban: {
                container: {
                    marginBottom: '15px',
                    marginTop: '10px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                },
                label: {
                    color: '#007722',
                    fontWeight: 'bold'
                },
                link: {
                    color: '#37a',
                    textDecoration: 'none',
                    margin: '0 4px'
                },
                separator: {
                    color: '#666'
                }
            },
            imdb: {
                container: {
                    marginBottom: '15px',
                    marginTop: '10px'
                },
                label: {
                    color: '#f5c518',
                    fontWeight: 'bold',
                    marginRight: '10px'
                },
                link: {
                    color: '#5799ef',
                    textDecoration: 'none',
                    margin: '0 5px'
                }
            }
        }
    };

    class MovieInfoExtractor {
        static fromDouban() {
            const imdbElement = Array.from(document.querySelectorAll('#info span.pl'))
                .find(span => span.innerText.includes('IMDb'));
            const imdbID = imdbElement?.nextSibling?.textContent.trim();

            if (!imdbID) {
                console.error('未找到IMDb编号');
                return null;
            }

            const titleElement = document.querySelector('span[property="v:itemreviewed"]');
            if (!titleElement) {
                console.error('未找到电影标题');
                return null;
            }

            const fullTitle = titleElement.textContent.trim();
            const titleMatch = fullTitle.match(/^(.*?)(?:\s([A-Za-z].*))?$/);
            const chineseName = titleMatch?.[1].trim() || '';
            const englishName = titleMatch?.[2]?.trim() || '';

            const releaseYear = document.querySelector('span[property="v:initialReleaseDate"]')
                ?.textContent.match(/\d{4}/)?.[0] || '未知年份';

            return { imdbID, chineseName, englishName, releaseYear };
        }

        static fromKIC() {
            const table = document.querySelector('.div6_4 .table6_4');
            if (!table) {
                console.error('未找到影片信息表格');
                return null;
            }

            const imdbLink = table.querySelector('a[href*="imdb.com/title/"]');
            const imdbID = imdbLink?.href.split('/title/')[1].replace('/', '');

            if (!imdbID) {
                console.error('未找到IMDb编号链接');
                return null;
            }

            const movieNameCell = Array.from(table.rows)
                .find(row => row.innerText.includes('影片名称'))?.cells[1];
            const [chineseName, englishName] = (movieNameCell?.textContent.trim() || '')
                .split('/').map(name => name.trim());

            const yearCell = Array.from(table.rows)
                .find(row => row.innerText.includes('出品年份'))?.cells[1];
            const releaseYear = yearCell?.textContent.trim().match(/\d{4}/)?.[0] || '未知年份';

            return { imdbID, chineseName, englishName, releaseYear };
        }

        static fromIMDB() {
            const imdbID = window.location.pathname.match(/title\/(tt\d+)\//)?.[1];
            if (!imdbID) {
                console.error('未找到IMDb编号');
                return null;
            }

            const title = document.querySelector('h1')?.textContent.trim() || '未知标题';
            const releaseYear = document.querySelector('li.ipc-inline-list__item a[href*="releaseinfo"]')
                ?.textContent.match(/\d{4}/)?.[0] || '未知年份';

            return { imdbID, title, releaseYear };
        }
    }

    class TNTSearchHandler {
        static async performSearch(imdbID) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://the.nextthing.club/search.php',
                    data: new URLSearchParams({
                        keywords: imdbID,
                        action: 'do_search',
                        postthread: '1'
                    }).toString(),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    onload: function(response) {
                        // 从重定向后的URL获取sid
                        const finalUrl = response.finalUrl;
                        resolve(finalUrl);
                    },
                    onerror: function(error) {
                        console.error('TNT search failed:', error);
                        resolve('https://the.nextthing.club/');
                    }
                });
            });
        }
    }

    class SearchLinkGenerator {
        static async createLinks(movieInfo, style) {
            if (style === 'kic') {
                return this.createKICLinks(movieInfo);
            }
            return this.createDefaultLinks(movieInfo, style);
        }

        static async createDefaultLinks(movieInfo, style) {
            const links = [];
            const { SEARCH_LINKS } = CONFIG;

            for (const [key, linkInfo] of Object.entries(SEARCH_LINKS)) {
                if (key === 'bt0' && !movieInfo.chineseName) continue;

                let url;
                if (key === 'tnt') {
                    url = await TNTSearchHandler.performSearch(movieInfo.imdbID);
                } else {
                    url = linkInfo.url
                        .replace('{imdbID}', movieInfo.imdbID || '')
                        .replace('{title}', encodeURIComponent(movieInfo.title || movieInfo.englishName || movieInfo.chineseName || ''))
                        .replace('{chineseTitle}', encodeURIComponent(movieInfo.chineseName || ''))
                        .replace('{year}', encodeURIComponent(movieInfo.releaseYear || ''));
                }

                links.push({
                    name: linkInfo.name,
                    url: url
                });
            }

            return this.generateDefaultHTML(links, style);
        }

        static async createKICLinks(movieInfo) {
            const quickSearchRow = document.createElement('tr');
            const quickSearchCell = document.createElement('td');
            quickSearchCell.colSpan = 2;
            quickSearchCell.style.padding = '10px';
            quickSearchCell.style.backgroundColor = '#f9f9f9';
            const encodedSearchName = encodeURIComponent(movieInfo.englishName || movieInfo.chineseName);

            const tntSearchUrl = await TNTSearchHandler.performSearch(movieInfo.imdbID);
            quickSearchCell.innerHTML = `
                <strong style="color: red;">快速搜索:</strong>
                <a href="https://search.douban.com/movie/subject_search?search_text=${movieInfo.imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">豆瓣</a> |
                <a href="https://www.imdb.com/title/${movieInfo.imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">IMDb</a> |
                <a href="https://www.themoviedb.org/search?query=${encodedSearchName}" target="_blank" style="color: #0073e6; text-decoration: none;">TMDB</a> |
                <a href="http://www.blu-ray.com/search/?section=bluraymovies&quicksearch_keyword=${encodedSearchName}&quicksearch=1" target="_blank" style="color: #0073e6; text-decoration: none;">Blu-ray</a> |
                <a href="https://mediaarea.net/MediaInfoOnline" target="_blank" style="color: #0073e6; text-decoration: none;">MediaInfo</a> |
                <a href="http://zmk.pw/search?q=${movieInfo.imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">【ZMK】</a> |
                <a href="https://www.opensubtitles.org/zh/search/sublanguageid-chi,zht,zhe,eng/imdbid-${movieInfo.imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">【OpenSub】</a> |
                <a href="https://www.kidsincinema.com/forum/search.php?mod=forum&searchsubmit=yes&srchtxt=${movieInfo.imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">光影童年</a> |
                <a href="http://blizzardkid.net/?action=search&search=${movieInfo.imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">Blizzardkid</a> |
                <a href="${tntSearchUrl}" target="_blank" style="color: #0073e6; text-decoration: none;">TNT</a> |
                <a href="https://bt4gprx.com/search?q=${encodedSearchName}+${encodeURIComponent(movieInfo.releaseYear)}&orderby=size&p=1" target="_blank" style="color: #0073e6; text-decoration: none;">BT4G</a> |
                <a href="https://www.0bt0.com/search?sb=${encodeURIComponent(movieInfo.chineseName)}" target="_blank" style="color: #0073e6; text-decoration: none;">不太灵</a>
            `;

            quickSearchRow.appendChild(quickSearchCell);
            return quickSearchRow;
        }

        static generateDefaultHTML(links, style) {
            const { container, label, link: linkStyle } = CONFIG.STYLES[style];

            const containerDiv = document.createElement('div');
            Object.assign(containerDiv.style, container);

            const labelSpan = document.createElement('span');
            labelSpan.textContent = '快速搜索:';
            Object.assign(labelSpan.style, label);
            containerDiv.appendChild(labelSpan);

            const linksSpan = document.createElement('span');
            linksSpan.style.display = 'inline-block';

            links.forEach((linkInfo, index) => {
                const a = document.createElement('a');
                a.href = linkInfo.url;
                a.textContent = linkInfo.name;
                a.target = '_blank';
                Object.assign(a.style, linkStyle);

                linksSpan.appendChild(a);

                if (index < links.length - 1) {
                    const separator = document.createTextNode(' | ');
                    linksSpan.appendChild(separator);
                }
            });

            containerDiv.appendChild(linksSpan);
            return containerDiv;
        }
    }

    async function initSearchModule() {
        const currentURL = window.location.href;
        let movieInfo, container, style;

        if (currentURL.includes('douban.com')) {
            movieInfo = MovieInfoExtractor.fromDouban();
            container = document.querySelector('span[property="v:itemreviewed"]')?.parentNode;
            style = 'douban';
        } else if (currentURL.includes('kidsincinema.com')) {
            movieInfo = MovieInfoExtractor.fromKIC();
            container = document.querySelector('.div6_4 .table6_4');
            style = 'kic';
        } else if (currentURL.includes('imdb.com')) {
            movieInfo = MovieInfoExtractor.fromIMDB();
            container = document.querySelector('h1')?.parentNode;
            style = 'imdb';
        }

        if (movieInfo && container) {
            const searchLinks = await SearchLinkGenerator.createLinks(movieInfo, style);

            if (style === 'kic') {
                const categoryRow = Array.from(container.rows).find(row => row.innerText.includes('影片分类'));
                if (categoryRow) {
                    categoryRow.parentNode.insertBefore(searchLinks, categoryRow.nextSibling);
                }
            } else {
                container.insertBefore(searchLinks, container.firstChild);
            }
        }
    }

    initSearchModule().catch(console.error);
})();