using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Branching;

public class UpstreamTrackingOverlay : IRenderable
{
    private readonly Panel _cachedPanel;

    public UpstreamTrackingOverlay()
    {
        var content = new Rows(
            new Text("New branch created successfully.", new Style(Color.Green)),
            new Text(""),
            new Text("Set upstream tracking (origin)?", new Style(Color.Magenta, decoration: Decoration.Bold)),
            new Text(""),
            new Markup("[grey][[Y]][/] Yes  [grey][[N/Esc]][/] No")
        );

        _cachedPanel = new Panel(content)
            .Header(" [bold magenta]Upstream Tracking[/] ")
            .Border(BoxBorder.Double)
            .BorderStyle(new Style(Color.Magenta))
            .Padding(1, 1, 1, 1);
    }

    public Measurement Measure(RenderOptions options, int maxWidth)
    {
        return ((IRenderable)_cachedPanel).Measure(options, maxWidth);
    }

    public IEnumerable<Segment> Render(RenderOptions options, int maxWidth)
    {
        return ((IRenderable)_cachedPanel).Render(options, maxWidth);
    }
}
