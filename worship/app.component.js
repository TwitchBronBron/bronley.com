angular.module('app', []).component('worshipApp', {
    templateUrl: 'app.component.html',
    controllerAs: 'vm',
    controller: function ($http, $sce) {
        var vm = this;
        vm.groups = [];
        vm.filteredGroups = [];
        vm.keys = [];
        vm.sortColumn = 'name';
        vm.sortAscending = true;
        vm.filterKey = undefined;
        vm.allKeys = ['G', 'Ab', 'A', 'Bb', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', '#'];
        var excludedExtensions = ['db', 'html'];

        vm.filterByKey = function (key) {
            vm.filterKey = key;
            var copy = vm.groups.slice();
            vm.filteredGroups = copy.filter(function (a) {
                return a.keys.indexOf(vm.filterKey) > -1;
            });
            vm.applySort(vm.filteredGroups);
        };

        vm.filterByTitle = function (text) {
            if (!text) {
                return vm.clearFilter();
            }
            vm.filterKey = undefined;
            vm.filteredGroups = vm.fuse.search(text);
            debugger;

            vm.applySort(vm.filteredGroups);
        };

        vm.clearFilter = function () {
            this.filterKey = undefined;
            this.filterText = undefined;
            this.filteredGroups = vm.groups.slice();
        }

        vm.sortChar = function (propName) {
            if (vm.sortColumn === propName) {
                return $sce.trustAsHtml(vm.sortAscending ? '&uarr;' : '&darr;');
            } else {
                return '';
            }
        };

        vm.sort = function (propName) {
            if (vm.sortColumn === propName) {
                vm.sortAscending = !vm.sortAscending;
            } else {
                vm.sortAscending = true;
            }
            vm.sortColumn = propName;
            vm.applySort(vm.filteredGroups);
            vm.applySort(vm.groups);
        };

        vm.applySort = function (data) {
            data.sort(function (a, b) {
                if (a[vm.sortColumn] instanceof Date) {
                    var cmp = a[vm.sortColumn] > b[vm.sortColumn] ? 1 : a[vm.sortColumn] == b[vm.sortColumn] ? 0 : -1;
                } else {
                    var cmp = a[vm.sortColumn].localeCompare(b[vm.sortColumn]);
                }
                return cmp * (vm.sortAscending ? 1 : -1);
            });
        }

        vm.$onInit = function () {
            var path = window.location.pathname;
            var page = path.split("/").pop();
            var indexerUrl = 'https://home.bronley.com:8443/worship/';
            $http.get(indexerUrl).then(function (response) {
                var text = response.data;

                var songs = [];
                var rows = text.split('\n')
                for (var i = 0; i < rows.length; i++) {
                    var regex = /\s*<a\s*href=\s*"(.*)"\s*>(.*)<\/a>\s*([\w-]*\s*[\w-:]*)/g;
                    var keyRegex = /\(([ABCDEFG#]{1,3})\)/gi;
                    var row = rows[i];
                    if (row.indexOf('<a') === 0) {
                        var match = regex.exec(row);
                        if (match) {

                            //use the url for the name since the name gets truncated
                            var url = indexerUrl + match[1];
                            var fileName = decodeURIComponent(match[1]);

                            var lastPeriodIndex = fileName.lastIndexOf('.');
                            var name = fileName.substring(0, lastPeriodIndex);
                            var ext = fileName.substring(lastPeriodIndex + 1);
                            var dateModified = new Date(match[3]);
                            var key = undefined;
                            var keyMatch = keyRegex.exec(name);
                            if (keyMatch) {
                                key = keyMatch[1];
                                var removeChordRegex = new RegExp("\\s*\\(" + keyMatch[0] + "\\)\\s*", "gi");
                                name = name.replace(removeChordRegex, "").trim();
                            } else {
                                key = '#';
                            }

                            //throw out folders and unwanted file types
                            if (name === '' || excludedExtensions.indexOf(ext.toLowerCase()) > -1) {
                                continue;
                            }
                            var record =
                            {
                                url: url,
                                name: name,
                                dateModified: dateModified,
                                extension: ext,
                                key: key
                            };
                            vm.keys.indexOf(record.key) === -1 ? vm.keys.push(record.key) : undefined;
                            songs.push(record);
                        }
                    }
                }

                //group every song
                var groups = [];
                var groupLookup = {};
                for (var i = 0; i < songs.length; i++) {
                    var song = songs[i];
                    var group;
                    if (!groupLookup[song.name.toLowerCase()]) {
                        group = {
                            name: song.name,
                            dateModified: song.dateModified,
                            keys: [],
                            songs: [],
                            songByKey: {}
                        };
                        groupLookup[song.name.toLowerCase()] = group;
                        groups.push(group)
                    } else {
                        group = groupLookup[song.name.toLowerCase()];
                    }
                    group.songs.push(song);
                    group.songByKey[song.key] = song;
                    group.keys.push(song.key);
                    if (group.dateModified < song.dateModified) {
                        group.dateModified = song.dateModified;
                    }
                }

                //sort all group keys
                for (var i = 0; i < groups.length; i++) {
                    var group = groups[i];
                    var sortedKeys = [];
                    for (var k = 0; k < vm.allKeys.length; k++) {
                        var key = vm.allKeys[k];
                        if (group.keys.indexOf(key) > -1) {
                            sortedKeys.push(key);
                        }
                    }
                    group.keys = sortedKeys;
                }
                vm.groups = groups;

                vm.applySort(vm.groups);
                vm.filteredGroups = vm.groups.slice();

                vm.fuse = new Fuse(groups, {
                    threshold: 0.4,
                    keys: ['name']
                })

                //load a file in an iframe to wake up the hard drive
                $http.get(vm.groups[0].songs[0].url);
            });
        };
    }
});
