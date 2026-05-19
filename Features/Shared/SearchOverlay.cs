using Spectre.Console;
using Spectre.Console.Rendering;

namespace GitVibe.Features.Shared;

public class SearchOverlay(string query) : IRenderable
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
            new Text("Filter by path:", new Style(Color.Magenta, decoration: Decoration.Bold)),
            new Text(""),
            new Panel(new Text(string.IsNullOrEmpty(query) ? " " : query))
                .Border(BoxBorder.Rounded)
                .BorderStyle(new Style(Color.Magenta))
                .Padding(1, 0, 1, 0),
            new Text(""),
            new Markup("[grey][[Esc]][/] Clear & Close")
        );

        return new Panel(content)
            .Header(" [bold magenta]Search / Filter[/] ")
            .Border(BoxBorder.Double)
            .BorderStyle(new Style(Color.Magenta))
            .Padding(1, 1, 1, 1);
    }
}
