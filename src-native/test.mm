@import Foundation;

#include "test.h"

@interface Test : NSObject
+ (int)get_1;
@end

@implementation Test
+ (int)get_1 {
  return 1;
}
@end

const SEL selector = @selector(lowercaseString);

extern "C" int get1FromObjCpp(void) { return [Test get_1]; }
