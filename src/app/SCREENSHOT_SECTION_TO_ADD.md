# Screenshot Section Code to Add

Insert this code after the Hero Section card (around line 432) and before the Features Section card in `/components/admin/LandingPageManager.tsx`:

```tsx
          {/* App Screenshot Mockup Section */}
          <Card className="p-6">
            <button
              onClick={() => toggleSection('screenshot')}
              className="w-full flex items-center justify-between mb-4"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-semibold">App Screenshot Mockup</h3>
              </div>
              {expandedSections.has('screenshot') ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {expandedSections.has('screenshot') && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    📱 <strong>App Mockup Content</strong> - Update the content shown in the phone screenshot on the landing page
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Greeting</Label>
                    <Input
                      value={content.screenshot.greeting}
                      onChange={(e) => setContent({
                        ...content,
                        screenshot: { ...content.screenshot, greeting: e.target.value }
                      })}
                      placeholder="Good Morning! ☀️"
                    />
                  </div>
                  <div>
                    <Label>Couple Names</Label>
                    <Input
                      value={content.screenshot.coupleNames}
                      onChange={(e) => setContent({
                        ...content,
                        screenshot: { ...content.screenshot, coupleNames: e.target.value }
                      })}
                      placeholder="Sarah & Mike"
                    />
                  </div>
                </div>

                <div>
                  <Label>Streak Days</Label>
                  <Input
                    value={content.screenshot.streakDays}
                    onChange={(e) => setContent({
                      ...content,
                      screenshot: { ...content.screenshot, streakDays: e.target.value }
                    })}
                    placeholder="45"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Devotional Card</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Badge</Label>
                      <Input
                        value={content.screenshot.devotional.badge}
                        onChange={(e) => setContent({
                          ...content,
                          screenshot: {
                            ...content.screenshot,
                            devotional: { ...content.screenshot.devotional, badge: e.target.value }
                          }
                        })}
                        placeholder="Today's Devotional"
                      />
                    </div>
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={content.screenshot.devotional.title}
                        onChange={(e) => setContent({
                          ...content,
                          screenshot: {
                            ...content.screenshot,
                            devotional: { ...content.screenshot.devotional, title: e.target.value }
                          }
                        })}
                        placeholder="Love is Patient"
                      />
                    </div>
                    <div>
                      <Label>Verse</Label>
                      <Textarea
                        value={content.screenshot.devotional.verse}
                        onChange={(e) => setContent({
                          ...content,
                          screenshot: {
                            ...content.screenshot,
                            devotional: { ...content.screenshot.devotional, verse: e.target.value }
                          }
                        })}
                        rows={2}
                        placeholder='"Love is patient and kind..."'
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Stats Numbers</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Devotionals Count</Label>
                      <Input
                        value={content.screenshot.stats.devotionals}
                        onChange={(e) => setContent({
                          ...content,
                          screenshot: {
                            ...content.screenshot,
                            stats: { ...content.screenshot.stats, devotionals: e.target.value }
                          }
                        })}
                        placeholder="45"
                      />
                    </div>
                    <div>
                      <Label>Prayers Count</Label>
                      <Input
                        value={content.screenshot.stats.prayers}
                        onChange={(e) => setContent({
                          ...content,
                          screenshot: {
                            ...content.screenshot,
                            stats: { ...content.screenshot.stats, prayers: e.target.value }
                          }
                        })}
                        placeholder="23"
                      />
                    </div>
                    <div>
                      <Label>Questions Count</Label>
                      <Input
                        value={content.screenshot.stats.questions}
                        onChange={(e) => setContent({
                          ...content,
                          screenshot: {
                            ...content.screenshot,
                            stats: { ...content.screenshot.stats, questions: e.target.value }
                          }
                        })}
                        placeholder="18"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Prayer Request</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={content.screenshot.prayerRequest.title}
                        onChange={(e) => setContent({
                          ...content,
                          screenshot: {
                            ...content.screenshot,
                            prayerRequest: { ...content.screenshot.prayerRequest, title: e.target.value }
                          }
                        })}
                        placeholder="New Prayer Request"
                      />
                    </div>
                    <div>
                      <Label>Text</Label>
                      <Input
                        value={content.screenshot.prayerRequest.text}
                        onChange={(e) => setContent({
                          ...content,
                          screenshot: {
                            ...content.screenshot,
                            prayerRequest: { ...content.screenshot.prayerRequest, text: e.target.value }
                          }
                        })}
                        placeholder="Mike needs prayer for work project"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
```

This should be inserted right after the closing `</Card>` tag of the Hero Section and before the `{/* Features Section */}` comment.
