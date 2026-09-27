import assert from "node:assert/strict";
import { test } from "node:test";
import { getEnvironmentGivingSettings } from "../src/lib/giving/config.server.ts";
import { givingSettingsSchema, receiptRequestSchema } from "../src/lib/giving/schemas.ts";
import type { CloudflareRuntimeRequest } from "../src/lib/db/d1.types.ts";

function configuredRequest(env: Record<string, string>) {
  const request = new Request("https://church.test/give") as CloudflareRuntimeRequest;
  request.runtime = { name: "cloudflare", cloudflare: { env, context: {} } };
  return request;
}

test("giving environment defaults fail closed until a method is fully verified", () => {
  const incomplete = getEnvironmentGivingSettings(
    configuredRequest({
      GIVING_ZELLE_ENABLED: "true",
      GIVING_ZELLE_ID: "giving@example.test",
    }),
  );
  assert.equal(incomplete.settings.methods[0].enabled, false);
  assert.ok(incomplete.setupRequired.includes("Zelle verified recipient name"));

  const complete = getEnvironmentGivingSettings(
    configuredRequest({
      GIVING_ZELLE_ENABLED: "true",
      GIVING_ZELLE_ID: "giving@example.test",
      GIVING_ZELLE_RECIPIENT_NAME: "Church Recipient",
    }),
  );
  assert.equal(complete.settings.methods[0].enabled, true);
  assert.deepEqual(complete.setupRequired, []);
});

test("receipt requests require consent and normalize donor email", () => {
  const input = {
    donorName: "Parish Donor",
    donorEmail: "DONOR@Example.com",
    amount: "125.50",
    paymentMethod: "zelle",
    giftDate: "2026-09-20",
    designation: "General Fund",
    transactionReference: "reference",
    note: "",
    consent: true,
    website: "",
    startedAt: Date.now() - 3000,
  };
  assert.equal(receiptRequestSchema.parse(input).donorEmail, "donor@example.com");
  assert.equal(receiptRequestSchema.safeParse({ ...input, consent: false }).success, false);
  assert.equal(receiptRequestSchema.safeParse({ ...input, amount: "12.345" }).success, false);
});

test("giving image paths reject traversal and external URLs", () => {
  const environment = getEnvironmentGivingSettings(configuredRequest({}));
  const base = environment.settings;
  assert.equal(
    givingSettingsSchema.safeParse({ ...base, socialImagePath: "/giving/share.jpg" }).success,
    true,
  );
  assert.equal(
    givingSettingsSchema.safeParse({ ...base, socialImagePath: "/giving/../secret" }).success,
    false,
  );
  assert.equal(
    givingSettingsSchema.safeParse({ ...base, socialImagePath: "https://example.test/a.jpg" })
      .success,
    false,
  );
});
