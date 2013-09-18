if (!localStorage) {
    alert("Your browser does not support saving changes. Entries will be lost after closing the browser or reloading the page.");
}

// *** Defines an individual test score
function testScore(studentName, score, onvalidate){
    var self = this;

    // ** Properties

    // * Student's name
    self.studentName = ko.observable(studentName ? studentName : "student name");

    // * Student's numeric scores (0-100)
    self.score = ko.observable(score ? score : 0);

    // ** Validation

    // * Name not empty
    self.studentName.invalid = ko.observable();
    self.studentName.subscribe(function(newValue) {
        self.studentName.invalid(newValue ? false : true);
        onvalidate(!self.score.invalid());
    });

    // * Score between 0-100
    self.score.invalid = ko.observable();
    self.score.subscribe(function(newValue) {
        var numericNewValue = isNaN(newValue) ? -1 : parseInt(newValue);
        self.score.invalid((isNaN(numericNewValue) || numericNewValue < 0 || numericNewValue > 100) ? true : false);
        onvalidate(!self.score.invalid());
    });
}

// *** Defines a set of test results
function testResults(){
    var self = this;

    // ** Properties

    // * Validations
    self.invalid = ko.observable(false);

    // * All test scores in the test
    self.testScores = ko.observableArray();

    // * Minimum test score
    self.minimumScore = ko.computed(function() {
        if (self.testScores().length == 0 || self.invalid()) return 0;

        var scoreValues = new Array();
        for (var i = 0; i < self.testScores().length; i++) {
            var score = self.testScores()[i].score();
            if (score != undefined) {
                scoreValues.push(isNaN(score) ? 0 : Number(score));
            }
        }

        return Math.min.apply(null, scoreValues);
    });

    // * Maximum test score
    self.maximumScore = ko.computed(function() {
        if (self.testScores().length == 0 || self.invalid()) return 0;

        var scoreValues = new Array();
        for (var i = 0; i < self.testScores().length; i++) {
            var score = self.testScores()[i].score();
            if (score != undefined) {
                scoreValues.push(isNaN(score) ? 0 : Number(score));
            }
        }

        return Math.max.apply(null, scoreValues);
    });

    // * Average test score
    self.averageScore = ko.computed(function() {
        if (self.testScores().length == 0 || self.invalid()) return 0;

        var total = 0;
        var scoreCount = 0; // we'll only want to include set testScores in our calculation
        for (var i = 0; i < self.testScores().length; i++) {
            var score = self.testScores()[i].score();
            if (score != undefined) {
                total += isNaN(score) ? 0 : Number(self.testScores()[i].score());
                scoreCount++;
            }
        }

        return scoreCount > 0 ? (total / scoreCount).toFixed(2) : "";
    });
//
    // ** Methods

    // * Add a new score to the list
    self.addNewScore = function() {
        if (self.invalid()) {
            return;
        }

        self.addScore(null, null);
    };

    // * Add a score to the list with the specified values
    self.addScore = function(studentName, score) {
        // Create score with values and wire in a handler for when score validated
        var score = new testScore(
            studentName,
            score,
            self.onTestScoreValidation
        );

        // Add to list
        self.testScores.push(score);
    };

    // * Delete the given score from the list
    self.deleteScore = function(score) {
        self.testScores.remove(score);
        self.save();
    }

    // * Save the data
    self.save = function(){
        if (!window.localStorage) return;

        // * Validate.
        // NOTE: We set flag when a field goes invalid but we need to re-validate all now to know if changes have made everything valid, since we allow a field to remain invalid.
        if (self.invalid()) {
            self.invalid(false);
            for (var i = 0; i < self.testScores().length; i++) {
                if (self.testScores()[i].studentName.invalid() || self.testScores()[i].score.invalid()) {
                    self.invalid(true);
                    break;
                }
            }
        }

        if (!self.invalid()) {
            localStorage["testResults"] = ko.toJSON(self);
        }
    }

    // ** Event Handlers

    // * When a score is validated (name or score value) and is invalid, set myself to invalid
    self.onTestScoreValidation = function(valid) {
        if (!valid) {
            self.invalid(true);
        }
    };
}

// *** Wire up knockout
var testResultsViewModel = new testResults();
ko.applyBindings(testResultsViewModel);

// Load any stored data or initialize for new list
if (window.localStorage && localStorage["testResults"]) {
    var storedResults = JSON.parse(localStorage["testResults"]);
    for (var i = 0; i < storedResults.testScores.length; i++) {
        testResultsViewModel.addScore(storedResults.testScores[i].studentName, storedResults.testScores[i].score);
    }
}

// Default to one new entry, if nothing loaded
if (testResultsViewModel.testScores().length == 0) {
    testResultsViewModel.addNewScore();
}