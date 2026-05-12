using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Shared;

public class CommandOverlay(string command) : IRenderable
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
            new Text("Run raw Git command:", new Style(Color.Cyan, decoration: Decoration.Bold)),
            new Text(""),
            new Panel(new Text(string.IsNullOrEmpty(command) ? "git " : command))
                .Border(BoxBorder.None)
                .Padding(1, 0, 1, 0),
            new Text(""),
            new Markup("[grey][[Enter]][/] Execute  [grey][[Esc]][/] Cancel")
        );

        return new Panel(content)
            .Header(" [bold cyan]Hybrid Command[/] ")
            .Border(BoxBorder.Double)
            .BorderStyle(new Style(Color.Cyan))
            .Padding(1, 1, 1, 1);
    }
}
