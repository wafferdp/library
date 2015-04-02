﻿var libraryApp = angular.module('library-ui', []);
var bookCoverData;
var bookCoverMetaData;

libraryApp.controller('libraryController', ['$http', function ($http) {

    var library = this;
    library.books = [];

    $http.get('api/library').success(function (data) {
        library.books = data;
    });

    this.removeBook = function (book) {
        $http.delete('api/library/' + book._id);
        library.books = library.books.filter(function (element) {
            return element._id != book._id;
        });
    }


}]);

var handleFileSelect

libraryApp.controller('bookController', ['$http', '$scope', function ($http, $scope) {
    this.book = {};
    this.book.cover = {};
    var bookControl = this;

    this.addBook = function (library) {
        //this.book.cover = {};
        //this.book.cover.meta = bookCoverMetaData;
        //this.book.cover.data = bookCoverData;
        var bookString = JSON.stringify(this.book);
        var postBook = this.book;
        $http.post('api/library', bookString).success(function (data) {
            postBook._id = data;
            library.books.push(postBook);
            bookControl.book = {};
        });
    };

    handleFileSelect = function (event) {
        var files = event.target.files;
        var file = files[0];
        if (files && file) {
            var reader = new FileReader();
            reader.onload = function (readerEvent) {
                var imageBase64Enc = btoa(readerEvent.target.result);
                bookControl.book.cover.meta = "data:" + file.type + ";base64,";
                bookControl.book.cover.data = imageBase64Enc;
                $scope.$apply();
            };

            reader.readAsBinaryString(file);
        }
    };
}]);

window.addEventListener('load', function (event) {
    document.getElementById('bookCover').addEventListener('change', handleFileSelect, false);
}, false);
