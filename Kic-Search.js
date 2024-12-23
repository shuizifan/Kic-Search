// ==UserScript==
// @name         Kic-Search
// @namespace    https://www.kidsincinema.com/
// @version      1.0
// @description  在豆瓣和光影童年电影页面添加快速搜索功能，提取 IMDb 编号、中文名、英文名和年份，生成多个平台的快捷搜索链接，并修复特殊字符问题
// @author       @shuizifan
// @match        https://movie.douban.com/subject/*
// @match        https://www.kidsincinema.com/forum/forum.php?mod=viewthread&tid=*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
/*
  变量说明：
  - imdbID: 用于存储影片的 IMDb 编号，通常以 "tt" 开头，例如 "tt0111161"。
  - chineseName: 用于存储影片的中文名称，例如 "肖申克的救赎"。
  - englishName: 用于存储影片的英文名称，例如 "The Shawshank Redemption"。
  - releaseYear: 用于存储影片的上映年份，例如 "1994"。

  这些变量被提取后，将用于快速搜索功能生成的链接中，方便用户在多个平台进行影片信息查询。
*/

    // 通用函数：获取 IMDb 编号、中文名、英文名和年份
    function extractMovieInfoDouban() {
        console.log("Douban Quick Search script loaded...");

        const imdbElement = Array.from(document.querySelectorAll('#info span.pl')).find(span => span.innerText.includes('IMDb'));
        const imdbID = imdbElement ? imdbElement.nextSibling.textContent.trim() : null;
        if (!imdbID) {
            console.error("未找到 IMDb 编号！");
            return null;
        }

        const titleElement = document.querySelector('span[property="v:itemreviewed"]');
        if (!titleElement) {
            console.error("未找到电影标题！");
            return null;
        }
        const fullTitle = titleElement.textContent.trim();
        const titleMatch = fullTitle.match(/^(.*?)(?:\s([A-Za-z].*))?$/);
        const chineseName = titleMatch ? titleMatch[1].trim() : '';
        const englishName = titleMatch && titleMatch[2] ? titleMatch[2].trim() : '';

        const releaseDateElement = document.querySelector('span[property="v:initialReleaseDate"]');
        const releaseYear = releaseDateElement ? releaseDateElement.textContent.match(/\d{4}/)?.[0] : '未知年份';

        return { imdbID, chineseName, englishName, releaseYear };
    }

    function extractMovieInfoKidsInCinema() {
        console.log("KidsInCinema Quick Search script loaded...");

        const table = document.querySelector('.div6_4 .table6_4');
        if (!table) {
            console.error("未找到影片信息表格！");
            return null;
        }

        const imdbLink = table.querySelector('a[href*="imdb.com/title/"]');
        if (!imdbLink) {
            console.error("未找到 IMDb 编号链接！");
            return null;
        }
        const imdbID = imdbLink.href.split('/title/')[1].replace('/', '');

        const movieNameCell = Array.from(table.rows).find(row => row.innerText.includes('影片名称'))?.cells[1];
        const fullMovieName = movieNameCell ? movieNameCell.textContent.trim() : '';
        const [chineseName, englishName] = fullMovieName.split('/').map(name => name.trim());

        const yearCell = Array.from(table.rows).find(row => row.innerText.includes('出品年份'))?.cells[1];
        const releaseYear = yearCell ? yearCell.textContent.trim().match(/\d{4}/)?.[0] : '未知年份';

        return { imdbID, chineseName, englishName, releaseYear };
    }

    // 创建快速搜索区域
    function createQuickSearchLinksDouban({ imdbID, chineseName, englishName, releaseYear }, container) {
        const quickSearchDiv = document.createElement('div');
        quickSearchDiv.style.marginBottom = '20px';
        quickSearchDiv.style.padding = '10px';
        quickSearchDiv.style.backgroundColor = '#f9f9f9';
        quickSearchDiv.style.border = '1px solid #ddd';
        quickSearchDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)'; // 添加阴影效果
        quickSearchDiv.style.borderRadius = '5px'; // 添加圆角效果

        const encodedSearchName = encodeURIComponent(englishName || chineseName);

        quickSearchDiv.innerHTML = `
            <p style="font-size: 0.5em; color: red">快速搜索：</p>
            <p style="line-height: 1.0; font-size: 0.5em;">
                <a href="https://search.douban.com/movie/subject_search?search_text=${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">豆瓣</a> |
                <a href="https://www.imdb.com/title/${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">IMDb</a> |
                <a href="https://www.themoviedb.org/search?query=${encodedSearchName}" target="_blank" style="color: #0073e6; text-decoration: none;">TMDB</a> |
                <a href="http://www.blu-ray.com/search/?section=bluraymovies&quicksearch_keyword=${encodedSearchName}&quicksearch=1" target="_blank" style="color: #0073e6; text-decoration: none;">Blu-ray</a> |
                <a href="https://mediaarea.net/MediaInfoOnline" target="_blank" style="color: #0073e6; text-decoration: none;">MediaInfo</a> |
                <a href="http://zmk.pw/search?q=${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">【ZMK】</a> |
                <a href="https://www.opensubtitles.org/zh/search/sublanguageid-chi,zht,zhe,eng/imdbid-${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">【OpenSub】</a> |
                <a href="https://www.kidsincinema.com/forum/search.php?mod=forum&searchsubmit=yes&srchtxt=${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">光影童年</a> |
                <a href="http://blizzardkid.net/?action=search&search=${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">Blizzardkid</a> |
                <a href="https://the.nextthing.club/" target="_blank" style="color: #0073e6; text-decoration: none;">TNT</a> |
                <a href="https://bt4gprx.com/search?q=${encodedSearchName}+${encodeURIComponent(releaseYear)}&orderby=size&p=1" target="_blank" style="color: #0073e6; text-decoration: none;">BT4G</a> |
                <a href="https://www.0bt0.com/search?sb=${encodeURIComponent(chineseName)}" target="_blank" style="color: #0073e6; text-decoration: none;">不太灵</a>
            </p>
        `;

        const titleParent = container;
        if (titleParent) {
            titleParent.insertBefore(quickSearchDiv, titleParent.firstChild);
            console.log("快速搜索功能已插入到标题上方！");
        }
    }

    function createQuickSearchLinksKidsInCinema({ imdbID, chineseName, englishName, releaseYear }, table) {
        const quickSearchRow = document.createElement('tr');
        const quickSearchCell = document.createElement('td');
        quickSearchCell.colSpan = 2; // 占据两列
        quickSearchCell.style.padding = '10px';
        quickSearchCell.style.backgroundColor = '#f9f9f9';

        const encodedSearchName = encodeURIComponent(englishName || chineseName);

        quickSearchCell.innerHTML = `
            <strong style="color: red;">快速搜索:</strong>
            <a href="https://search.douban.com/movie/subject_search?search_text=${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">豆瓣</a> |
            <a href="https://www.imdb.com/title/${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">IMDb</a> |
            <a href="https://www.themoviedb.org/search?query=${encodedSearchName}" target="_blank" style="color: #0073e6; text-decoration: none;">TMDB</a> |
            <a href="http://www.blu-ray.com/search/?section=bluraymovies&quicksearch_keyword=${encodedSearchName}&quicksearch=1" target="_blank" style="color: #0073e6; text-decoration: none;">Blu-ray</a> |
            <a href="https://mediaarea.net/MediaInfoOnline" target="_blank" style="color: #0073e6; text-decoration: none;">MediaInfo</a> |
            <a href="http://zmk.pw/search?q=${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">【ZMK】</a> |
            <a href="https://www.opensubtitles.org/zh/search/sublanguageid-chi,zht,zhe,eng/imdbid-${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">【OpenSub】</a> |
            <a href="https://www.kidsincinema.com/forum/search.php?mod=forum&searchsubmit=yes&srchtxt=${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">光影童年</a> |
            <a href="http://blizzardkid.net/?action=search&search=${imdbID}" target="_blank" style="color: #0073e6; text-decoration: none;">Blizzardkid</a> |
            <a href="https://the.nextthing.club/" target="_blank" style="color: #0073e6; text-decoration: none;">TNT</a> |
            <a href="https://bt4gprx.com/search?q=${encodedSearchName}+${encodeURIComponent(releaseYear)}&orderby=size&p=1" target="_blank" style="color: #0073e6; text-decoration: none;">BT4G</a> |
            <a href="https://www.0bt0.com/search?sb=${encodeURIComponent(chineseName)}" target="_blank" style="color: #0073e6; text-decoration: none;">不太灵</a>
        `;

        quickSearchRow.appendChild(quickSearchCell);

        const categoryRow = Array.from(table.rows).find(row => row.innerText.includes('影片分类'));
        if (categoryRow) {
            categoryRow.parentNode.insertBefore(quickSearchRow, categoryRow.nextSibling);
            console.log("快速搜索功能已添加到影片分类的下一行！");
        }
    }

    // 主逻辑
    if (window.location.href.includes('douban.com')) {
        const movieInfo = extractMovieInfoDouban();
        if (movieInfo) {
            const titleElement = document.querySelector('span[property="v:itemreviewed"]');
            const parentContainer = titleElement ? titleElement.parentNode : document.body;
            createQuickSearchLinksDouban(movieInfo, parentContainer);
        }
    } else if (window.location.href.includes('kidsincinema.com')) {
        const movieInfo = extractMovieInfoKidsInCinema();
        if (movieInfo) {
            const table = document.querySelector('.div6_4 .table6_4');
            if (table) {
                createQuickSearchLinksKidsInCinema(movieInfo, table);
            }
        }
    }
})();
