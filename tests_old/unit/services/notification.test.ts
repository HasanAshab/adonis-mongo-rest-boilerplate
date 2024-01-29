import DB from "DB";
import NotificationService from "~/app/services/NotificationService";
import Mail from "Mail";
import User from "~/app/models/User";
import Notification from "~/app/models/Notification";
import BaseNotification from "~/core/abstract/Notification";

class TestMail {}

class TestNotification extends BaseNotification {
  via = () => ["email", "site"];
  toSite = () => ({ foo: "bar" });
  toEmail = () => new TestMail();
}

describe("notification", () => {
  const notificationService = resolve(NotificationService);
  
  beforeAll(async () => {
    await DB.connect();
  });
  
  beforeEach(async () => {
    await DB.reset(["User", "Notification"]);
    Mail.mockClear();
  });
  
  test("Should send notification via email", async ({ client, expect }) => {
    class Test extends TestNotification {
      via = () => ["email"];
    }
    const user = await User.factory().make();
    await notificationService.send(user, new Test)
    Mail.assertSentTo(user.email, TestMail);
  });
  
  test("Should send notification via site (database)", async ({ client, expect }) => {
    const user = await User.factory().create();
    class Test extends TestNotification {
      via = () => ["site"];
    }
    
    await notificationService.send(user, new Test);
    
    await Notification.assertHas({ 
      data: { foo: "bar" }
    });
  });

  test("Should send notification to multiple users", async ({ client, expect }) => {
    const users = await User.factory().count(2).make();
    class Test extends TestNotification {
      via = () => ["email"];
    }
    await notificationService.send(users, new Test);
    
    users.forEach(({ email }) => {
      Mail.assertSentTo(email, TestMail);
    });
  });
  
  test("Should send notification via multiple channels", async ({ client, expect }) => {
    const user = await User.factory().create();
    await notificationService.send(user, new TestNotification);
    
    Mail.assertSentTo(user.email, TestMail);
    await Notification.assertHas({ 
      data: { foo: "bar" }
    });
  });
});
