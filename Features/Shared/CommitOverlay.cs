using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Shared;

public class CommitOverlay(string message) : IRenderable
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
            new Text("Enter commit message:", new Style(Color.Blue, decoration: Decoration.Bold)),
            new Text(""),
            new Panel(new Text(string.IsNullOrEmpty(message) ? " " : message))
                .Border(BoxBorder.None)
                .Padding(1, 0, 1, 0),
            new Text(""),
            new Markup("[grey][[Enter]][/] Commit  [grey][[Esc]][/] Cancel")
        );

        return new Panel(content)
            .Header(" [bold yellow]Commit Changes[/] ")
            .Border(BoxBorder.Double)
            .BorderStyle(new Style(Color.Yellow))
            .Padding(1, 1, 1, 1);
    }
}
