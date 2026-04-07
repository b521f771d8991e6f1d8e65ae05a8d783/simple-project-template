#define BOOST_TEST_MODULE core_test
#include <boost/test/unit_test.hpp>

extern "C" int get1FromObjCpp(void);

BOOST_AUTO_TEST_CASE(get1FromObjCpp_returns_1) {
  BOOST_CHECK_EQUAL(get1FromObjCpp(), 1);
}
