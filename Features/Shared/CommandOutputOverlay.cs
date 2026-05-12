using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Shared;

public class CommandOutputOverlay(string output) : IRenderable
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
            new Text(output),
            new Text(""),
            new Markup("[grey]Press any key to continue...[/]")
        );

        return new Panel(content)
            .Header(" [bold green]Command Output[/] ")
            .Border(BoxBorder.Double)
            .BorderStyle(new Style(Color.Green))
            .Padding(1, 1, 1, 1);
    }
}
