using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Shared;

public class ErrorOverlay(string message) : IRenderable
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
        return new Panel(new Markup($"[red]Error:[/] {Markup.Escape(message)}"))
            .Header(" [bold red]Git Error[/] ")
            .Border(BoxBorder.Double)
            .BorderStyle(new Style(Color.Red))
            .Padding(1, 1, 1, 1);
    }
}
