/**
 * Displays a welcome carousel introducing the app.
 */

var WelcomeCarouselCtrl = function ($scope, $state, acmUserDefaults) {

  $scope.slides = [
    'ng_partials/welcome/get_notified.html',
    'ng_partials/welcome/contact_congress.html',
    'ng_partials/welcome/new_projects.html'
  ];

  // Tweak the second slide for non-US users.
  if ((navigator.language || '').slice(-2).toUpperCase() !== 'US') {
    $scope.slides[1] = 'ng_partials/welcome/international.html';
  }

  $scope.openShareAppPage = function () {
    acmUserDefaults.setUserDefault(acmUserDefaults.keys.USER_HAS_COMPLETED_WELCOME, true);
    $state.go('acm.homeTabs.action', undefined, {location:'replace'});
  };

};


module.exports = WelcomeCarouselCtrl;
