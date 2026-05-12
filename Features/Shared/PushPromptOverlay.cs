using Spectre.Console;
using Spectre.Console.Rendering;
using GitVibe.Styles;

namespace GitVibe.Features.Shared;

public class PushPromptOverlay : IRenderable
{
    public Measurement Measure(RenderOptions options, int maxWidth)
    {
        var panel = CreatePanel();
        return ((IRenderable)panel).Measure(options, maxWidth);
    }

    public IEnumerable<Segment> Render(RenderOptions options, int maxWidth)
    {
        var panel = CreatePanel();
        return ((IRenderable)panel).Render(options, maxWidth);
    }

    private Panel CreatePanel()
    {
        var content = new Rows(
            new Text("Push changes to remote?", new Style(Color.Blue, decoration: Decoration.Bold)),
            new Text(""),
            new Markup("[grey][[Y]][/] Yes  [grey][[N/Esc]][/] No")
        );

        return new Panel(content)
            .Header(" [bold yellow]Git Push[/] ")
            .Border(BoxBorder.Double)
            .BorderStyle(new Style(Color.Yellow))
            .Padding(2, 1, 2, 1);
    }
}
