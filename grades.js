if (!localStorage) {
	alert("Your browser does not support saving changes. Entries will be lost after closing the browser or reloading the page.");
}

var isValid = true;

// *** Defines an individual test score
function testScore(studentName, score){
    var self = this;

    // ** Properties

    // * Student's name
    self.studentName = ko.observable(studentName ? studentName : "student name").extend({ validateName: null });

    // * Student's numeric scores (0-100)
    self.score = ko.observable(score ? score : 0).extend({ validateScore: null });
}

// *** Defines a set of test results
function testResults(){
    var self = this;

    // ** Properties

    // * All test scores in the test
    self.testScores = ko.observableArray();

    // * Minimum test score
    self.minimumScore = ko.computed(function() {
        if (self.testScores().length == 0) return 0;

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
        if (self.testScores().length == 0) return 0;

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
        if (self.testScores().length == 0) return 0;

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
        if (!isValid) {
            return;
        }

        self.testScores.push(new testScore());
    };

    // * Add a score to the list with the specified values
    self.addScore = function(studentName, score) {
        self.testScores.push(new testScore(studentName, score));
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
        // NOTE: We set a flag when a field goes invalid but we need to re-validate all now to know if changes have made everything valid, since we allow a field to remain invalid.
        if (!isValid) {
            isValid = true;
            for (var i = 0; i < self.testScores().length; i++) {
                if (self.testScores()[i].studentName.invalid() || self.testScores()[i].score.invalid()) {
                    isValid = false;
                    break;
                }
            }
        }

        if (isValid) {
            localStorage["testResults"] = ko.toJSON(self);
        }
    }
}

// *** Validation

// * Ensure value is an integer between 0-100
ko.extenders.validateScore = function(target){
    target.invalid = ko.observable();

    function validate(newValue) {
        var numericNewValue = isNaN(newValue) ? -1 : parseInt(newValue);
        target.invalid((isNaN(numericNewValue) || numericNewValue < 0 || numericNewValue > 100) ? true : false);
        if (target.invalid()) {
            isValid = false;
        }
    }

    validate(target());

    target.subscribe(validate);

    return target;
}

// * Ensure value is not empty
ko.extenders.validateName = function(target){
    target.invalid = ko.observable();

    function validate(newValue) {
        target.invalid(newValue ? false : true);
        if (target.invalid()) {
            isValid = false;
        }
    }

    validate(target());

    target.subscribe(validate);

    return target;
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
